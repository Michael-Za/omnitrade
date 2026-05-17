"""
Google Sheets Service - Optional integration for trade logging and permission matrix.
No longer returns mock data - raises errors or returns empty when not configured.
Real market data comes from market_data_service.py instead.
"""
import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    logger.info("Google API libraries not found. Sheets integration disabled.")

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']


class SheetsService:
    """
    Google Sheets integration for:
    - Trade logging
    - Permission matrix overrides
    - Manual signal overrides

    This is OPTIONAL. The system works fully without it.
    All real market data comes from market_data_service.py.
    """

    def __init__(self, service_account_file: str = 'service_account.json'):
        self.service = None
        self.is_configured = False

        if GOOGLE_LIBS_AVAILABLE and os.path.exists(service_account_file):
            try:
                creds = Credentials.from_service_account_file(service_account_file, scopes=SCOPES)
                self.service = build('sheets', 'v4', credentials=creds)
                self.is_configured = True
                logger.info("Connected to Google Sheets API")
            except Exception as e:
                logger.error(f"Failed to connect to Google Sheets: {e}")

    def get_market_data(self, spreadsheet_id: str, range_name: str) -> Optional[List]:
        """
        Read data from a Google Sheet.
        Returns None if not configured - the system should use real API data instead.
        """
        if not self.is_configured:
            return None

        try:
            sheet = self.service.spreadsheets()
            result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
            values = result.get('values', [])
            return values
        except Exception as e:
            logger.error(f"Error reading sheet: {e}")
            return None

    def write_trade_log(self, spreadsheet_id: str, range_name: str, values: List) -> bool:
        """Write trade execution data to a Google Sheet for logging."""
        if not self.is_configured:
            return False

        try:
            body = {'values': values}
            self.service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Error writing to sheet: {e}")
            return False


# Singleton
sheets_service = SheetsService()
