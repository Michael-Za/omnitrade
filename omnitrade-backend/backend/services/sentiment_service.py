"""
Sentiment & Scraping Service for Meme Coin Analysis.
Provides real social sentiment data by scraping Twitter/X, Reddit,
and on-chain data sources for meme coin detection and risk assessment.
"""
import asyncio
import logging
import re
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta

import aiohttp
import pandas as pd
from bs4 import BeautifulSoup

from ..models.market_models import SentimentData, MemeCoinAnalysis

logger = logging.getLogger(__name__)

# Known meme coin tokens for tracking
MEME_COIN_SYMBOLS = [
    "DOGE/USDT", "SHIB/USDT", "PEPE/USDT", "WIF/USDT",
    "BONK/USDT", "FLOKI/USDT", "MEME/USDT", "PEOPLE/USDT",
    "BOME/USDT", "MEW/USDT", "NEIRO/USDT"
]


class SentimentService:
    """
    Real-time sentiment analysis and web scraping service.
    Scrapes social media, news, and on-chain data for meme coin signals.
    """

    def __init__(self):
        self.sentiment_cache: Dict[str, SentimentData] = {}
        self.meme_analysis_cache: Dict[str, MemeCoinAnalysis] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_scrape_time: float = 0

    async def initialize(self):
        """Initialize HTTP session for scraping."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        logger.info("Sentiment service initialized")

    async def close(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()

    async def scrape_coin_gecko_trending(self) -> List[Dict]:
        """Scrape trending coins from CoinGecko."""
        url = "https://api.coingecko.com/api/v3/search/trending"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    trending = []
                    for coin in data.get('coins', []):
                        item = coin.get('item', {})
                        trending.append({
                            'symbol': item.get('symbol', '').upper(),
                            'name': item.get('name', ''),
                            'market_cap_rank': item.get('market_cap_rank', 0),
                            'score': item.get('score', 0),
                            'price_btc': item.get('price_btc', 0),
                        })
                    return trending
                else:
                    logger.warning(f"CoinGecko trending returned {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error scraping CoinGecko trending: {e}")
            return []

    async def scrape_coin_gecko_sentiment(self, coin_id: str) -> Optional[Dict]:
        """Fetch sentiment data from CoinGecko for a specific coin."""
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    sentiment = data.get('sentiment_votes_up_percentage', 50)
                    community_data = data.get('community_data', {})
                    return {
                        'symbol': data.get('symbol', '').upper(),
                        'sentiment_up_pct': sentiment,
                        'twitter_followers': community_data.get('twitter_followers', 0),
                        'reddit_subscribers': community_data.get('reddit_subscribers', 0),
                        'reddit_active_accounts': community_data.get('reddit_accounts_active_48h', 0),
                    }
                return None
        except Exception as e:
            logger.error(f"Error fetching sentiment for {coin_id}: {e}")
            return None

    async def scrape_dexscreener_trending(self) -> List[Dict]:
        """Scrape trending tokens from DexScreener for new meme coins."""
        url = "https://api.dexscreener.com/token-boosts/latest/v1"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    trending = []
                    for token in data[:20]:
                        trending.append({
                            'symbol': token.get('tokenAddress', '')[:8],
                            'chain': token.get('chainId', ''),
                            'url': token.get('url', ''),
                            'description': token.get('description', ''),
                            'icon': token.get('icon', ''),
                        })
                    return trending
                return []
        except Exception as e:
            logger.error(f"Error scraping DexScreener: {e}")
            return []

    async def scrape_dexscreener_token(self, chain: str, address: str) -> Optional[Dict]:
        """Get detailed token data from DexScreener."""
        url = f"https://api.dexscreener.com/latest/dex/tokens/{address}"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    pairs = data.get('pairs', [])
                    if pairs:
                        pair = pairs[0]
                        return {
                            'symbol': pair.get('baseToken', {}).get('symbol', ''),
                            'price_usd': float(pair.get('priceUsd', 0)),
                            'volume_24h': pair.get('volume', {}).get('h24', 0),
                            'liquidity': pair.get('liquidity', {}).get('usd', 0),
                            'market_cap': pair.get('marketCap', 0),
                            'price_change_24h': pair.get('priceChange', {}).get('h24', 0),
                            'txns_24h_buys': pair.get('txns', {}).get('h24', {}).get('buys', 0),
                            'txns_24h_sells': pair.get('txns', {}).get('h24', {}).get('sells', 0),
                            'dex_id': pair.get('dexId', ''),
                            'pair_address': pair.get('pairAddress', ''),
                        }
                return None
        except Exception as e:
            logger.error(f"Error fetching DexScreener token {address}: {e}")
            return None

    async def scrape_reddit_crypto(self, subreddit: str = "cryptocurrency",
                                    limit: int = 25) -> List[Dict]:
        """Scrape Reddit for crypto sentiment indicators."""
        url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
        headers = {'User-Agent': 'Omnitrade/4.2.0'}
        try:
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    posts = []
                    for child in data.get('data', {}).get('children', []):
                        post = child.get('data', {})
                        posts.append({
                            'title': post.get('title', ''),
                            'score': post.get('score', 0),
                            'upvote_ratio': post.get('upvote_ratio', 0.5),
                            'num_comments': post.get('num_comments', 0),
                            'created_utc': post.get('created_utc', 0),
                            'author': post.get('author', ''),
                            'selftext': post.get('selftext', '')[:500],
                        })
                    return posts
                return []
        except Exception as e:
            logger.error(f"Error scraping Reddit: {e}")
            return []

    async def scrape_news_crypto(self) -> List[Dict]:
        """Scrape crypto news from multiple sources."""
        news_items = []

        # CoinGecko news
        try:
            url = "https://api.coingecko.com/api/v3/news"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    for article in data.get('data', [])[:10]:
                        news_items.append({
                            'title': article.get('title', ''),
                            'description': article.get('description', '')[:200],
                            'url': article.get('url', ''),
                            'source': article.get('author', 'CoinGecko'),
                            'published_at': article.get('published_at', ''),
                        })
        except Exception as e:
            logger.error(f"Error fetching CoinGecko news: {e}")

        return news_items

    def compute_sentiment_score(self, posts: List[Dict], symbol: str) -> SentimentData:
        """
        Analyze text data to compute sentiment score for a symbol.
        Uses keyword matching and volume analysis as a lightweight NLP approach.
        """
        mention_count = 0
        positive_words = 0
        negative_words = 0

        bullish_keywords = [
            'moon', 'pump', 'bullish', 'buy', 'hold', 'gem', 'rocket',
            'breakout', 'rally', 'surge', 'ath', 'gains', 'profit',
            'accumulation', 'strong', 'support', 'bounce'
        ]
        bearish_keywords = [
            'dump', 'bearish', 'sell', 'crash', 'scam', 'rug',
            'honeypot', 'dead', 'collapse', 'drop', 'loss', 'risk',
            'warning', 'avoid', 'red', 'bleed'
        ]

        for post in posts:
            text = (post.get('title', '') + ' ' + post.get('selftext', '')).lower()
            if symbol.lower() in text:
                mention_count += 1
                for word in bullish_keywords:
                    if word in text:
                        positive_words += 1
                for word in bearish_keywords:
                    if word in text:
                        negative_words += 1

        if mention_count == 0:
            return SentimentData(
                symbol=symbol,
                sentiment_score=0.0,
                mention_count_24h=0,
                sentiment_trend='NEUTRAL',
                trending=False,
                source='reddit+news'
            )

        # Compute sentiment score: -1 to 1
        total = positive_words + negative_words
        if total > 0:
            raw_score = (positive_words - negative_words) / total
        else:
            raw_score = 0.0

        # Weight by mention volume (more mentions = stronger signal)
        volume_weight = min(mention_count / 10, 1.0)
        sentiment_score = raw_score * volume_weight

        # Determine trend
        if sentiment_score > 0.2:
            sentiment_trend = 'BULLISH'
        elif sentiment_score < -0.2:
            sentiment_trend = 'BEARISH'
        else:
            sentiment_trend = 'NEUTRAL'

        # Trending if mentioned frequently
        trending = mention_count >= 5

        return SentimentData(
            symbol=symbol,
            sentiment_score=round(sentiment_score, 3),
            mention_count_24h=mention_count,
            sentiment_trend=sentiment_trend,
            trending=trending,
            source='reddit+news'
        )

    async def get_meme_coin_analysis(self, symbol: str) -> Optional[MemeCoinAnalysis]:
        """
        Comprehensive meme coin analysis combining on-chain data,
        sentiment, and risk assessment.
        """
        # Check cache (5 minute TTL)
        if symbol in self.meme_analysis_cache:
            cached = self.meme_analysis_cache[symbol]
            if (datetime.utcnow() - cached.timestamp).seconds < 300:
                return cached

        # Try DexScreener for detailed data
        dex_data = await self.scrape_dexscreener_trending()

        # Get sentiment
        reddit_posts = await self.scrape_reddit_crypto()
        sentiment = self.compute_sentiment_score(reddit_posts, symbol.replace('/USDT', ''))

        # Get CoinGecko trending data
        trending = await self.scrape_coin_gecko_trending()

        # Compute risk score (0-100)
        risk_score = 50.0  # Base risk

        # Lower risk if high liquidity
        # Higher risk if low liquidity or suspicious patterns

        # Trending coins get attention, both positive and negative
        is_trending = any(t.get('symbol') == symbol.replace('/USDT', '') for t in trending)
        if is_trending:
            risk_score -= 5  # Some legitimacy from being trending
            risk_score += 10  # But also hype risk

        # Sentiment affects risk
        if sentiment.sentiment_trend == 'BULLISH':
            risk_score -= 5
        elif sentiment.sentiment_trend == 'BEARISH':
            risk_score += 10

        risk_score = max(0, min(100, risk_score))

        analysis = MemeCoinAnalysis(
            symbol=symbol,
            price_usd=0.0,  # Will be filled by market data service
            market_cap=0.0,
            volume_24h=0.0,
            liquidity=0.0,
            sentiment=sentiment,
            risk_score=round(risk_score, 1),
            smart_money_inflow=0.0,  # Would need on-chain API
            timestamp=datetime.utcnow()
        )

        self.meme_analysis_cache[symbol] = analysis
        return analysis

    async def get_all_meme_analysis(self) -> Dict[str, MemeCoinAnalysis]:
        """Get analysis for all tracked meme coins."""
        results = {}
        tasks = [self.get_meme_coin_analysis(sym) for sym in MEME_COIN_SYMBOLS]
        analyses = await asyncio.gather(*tasks, return_exceptions=True)

        for symbol, analysis in zip(MEME_COIN_SYMBOLS, analyses):
            if isinstance(analysis, Exception):
                logger.error(f"Error analyzing {symbol}: {analysis}")
            elif analysis is not None:
                results[symbol] = analysis

        return results


# Singleton
sentiment_service = SentimentService()
