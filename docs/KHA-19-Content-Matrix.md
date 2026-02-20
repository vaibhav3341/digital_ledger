# KHA-19 Per-Screen Content Matrix

## WelcomeScreen
Keep
- App title
- Phone input
- Continue CTA

Remove
- Long explanatory copy

Move to overflow/secondary
- None

## LoadingScreen
Keep
- Spinner
- Short sync status

Remove
- Any actions

Move to overflow/secondary
- None

## AdminHomeScreen
Keep
- Admin identity
- Ledger/People switch
- Summary strip
- Filters
- Transactions/recipients list
- Contextual sticky CTA (Add Transaction or Add Recipient)

Remove
- Repeated subtitle text blocks
- Always-visible Sign Out and Get Statement body buttons
- Dense card metadata

Move to overflow/secondary
- Sign Out
- Get Statement
- Delete actions

## RecipientLedgerScreen
Keep
- Recipient summary card
- Optional All/Sent/Received filters
- Transaction history
- Send/Receive actions when editable

Remove
- Duplicate subtitle text

Move to overflow/secondary
- Delete transaction

## CoworkerHomeScreen
Keep
- Recipient profile context
- Net/sent/received summary
- Transaction list grouped by month

Remove
- Persistent body-level Sign Out button

Move to overflow/secondary
- Sign Out

## AddRecipientScreen
Keep
- Mode selector: From Contacts / Manual
- Essential recipient fields
- Add Recipient CTA

Remove
- Inline heavy contacts listing in main scroll

Move to overflow/secondary
- Contact browsing/search in modal sheet

## AddTransactionScreen
Keep
- Recipient
- Direction
- Amount
- Date picker row
- Optional note
- Save CTA

Remove
- Manual date typing primary path
- Always-open optional note area

Move to overflow/secondary
- None

## GetStatementScreen
Keep
- Recipient scope selector
- Range presets: Till date / This month / Custom
- Generate Statement CTA
- Output summary

Remove
- Dense instructional text
- Multiple equal-priority body actions

Move to overflow/secondary
- Open/Share after generation
