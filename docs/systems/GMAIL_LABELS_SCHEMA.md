# Gmail Labels Schema Documentation

## Overview
This document provides the complete schema structure for Gmail labels as used in the Floworx application.

## Gmail API Label Schema

### Request Body (Create Label)
```json
{
  "name": "string",
  "labelListVisibility": "labelShow" | "labelShowIfUnread" | "labelHide",
  "messageListVisibility": "show" | "hide",
  "color": {
    "backgroundColor": "string (hex color)",
    "textColor": "string (hex color)"
  }
}
```

### Response Body (Label Created)
```json
{
  "id": "string (Gmail assigned ID)",
  "name": "string",
  "type": "system" | "user",
  "labelListVisibility": "labelShow" | "labelShowIfUnread" | "labelHide",
  "messageListVisibility": "show" | "hide",
  "color": {
    "backgroundColor": "string (hex color)",
    "textColor": "string (hex color)"
  },
  "messagesTotal": "integer",
  "messagesUnread": "integer",
  "threadsTotal": "integer",
  "threadsUnread": "integer"
}
```

## Standard Labels Structure

### Parent Labels Configuration
```javascript
const standardLabels = {
  "BANKING": { 
    sub: [
      "BankAlert", 
      "e-Transfer/From Business", 
      "e-Transfer/To Business", 
      "Invoice", 
      "Payment Confirmation", 
      "Receipts/Payment Received", 
      "Receipts/Payment Sent", 
      "Refund"
    ] 
  },
  "MANAGER": { sub: ["Unassigned"] },
  "SUPPLIERS": { sub: [] },
  "SUPPORT": { sub: ["Appointment Sch...", "General", "Parts And Chemic...", "Technical Support"] },
  "SALES": { sub: [] },
  "FORMSUB": { sub: ["New Submission", "Work Order Forms"] },
  "SOCIALMEDIA": { sub: [] },
  "PHONE": { sub: [] },
  "MISC": { sub: [] },
  "URGENT": { sub: [] },
  "GOOGLE REVIEW": { sub: [] },
  "RECRUITMENT": { sub: [] },
  "PROMO": { sub: [] }
};
```

### Label Colors Configuration
```javascript
const labelColors = {
  "BANKING": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "FORMSUB": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "GOOGLE REVIEW": { backgroundColor: "#ff7537", textColor: "#ffffff" }, // Reddish-orange
  "MANAGER": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "MISC": { backgroundColor: "#999999", textColor: "#ffffff" }, // Grey
  "PHONE": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "PROMO": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "RECRUITMENT": { backgroundColor: "#e07798", textColor: "#ffffff" }, // Pinkish-red
  "SALES": { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  "SOCIALMEDIA": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "SUPPLIERS": { backgroundColor: "#ffad47", textColor: "#000000" }, // Orange
  "SUPPORT": { backgroundColor: "#4a86e8", textColor: "#ffffff" }, // Blue
  "URGENT": { backgroundColor: "#ff7537", textColor: "#ffffff" } // Reddish-orange
};
```

## Dynamic Labels

### Manager Labels
- **Source**: `profile.managers` array from database
- **Format**: `MANAGER/[Manager Name]`
- **Example**: `MANAGER/John Smith`
- **Color**: Orange (#ffad47)

### Supplier Labels
- **Source**: `profile.suppliers` array from database
- **Format**: `SUPPLIERS/[Supplier Name]`
- **Example**: `SUPPLIERS/Acme Corp`
- **Color**: Orange (#ffad47)

## API Endpoints

### Create Label
```
POST https://www.googleapis.com/gmail/v1/users/me/labels
Authorization: Bearer [ACCESS_TOKEN]
Content-Type: application/json
```

### List Labels
```
GET https://www.googleapis.com/gmail/v1/users/me/labels
Authorization: Bearer [ACCESS_TOKEN]
```

## Label Creation Process

### 1. Static Labels
- Parent labels (BANKING, MANAGER, SUPPLIERS, etc.) are created first
- Sub-labels are created with nested naming: `PARENT/CHILD`

### 2. Dynamic Labels
- Manager names from `profile.managers` are added to `MANAGER` sub-labels
- Supplier names from `profile.suppliers` are added to `SUPPLIERS` sub-labels

### 3. Nested Structure
```javascript
// Gmail uses slash notation for nested labels
const fullLabelName = `${parentLabelName}/${subLabelName}`;
// Example: "MANAGER/John Smith"
```

## Error Handling

### Common Errors
- **409 Conflict**: Label already exists
- **400 Bad Request**: Invalid color or name
- **401 Unauthorized**: Token expired
- **429 Too Many Requests**: Rate limit exceeded

### Fallback Behavior
- If color creation fails, retry without color
- If label exists, skip creation and continue
- Log all errors for debugging

## Example Usage

### Creating a Banking Label
```javascript
const bankingLabel = await createLabelOrFolder(
  'gmail',
  accessToken,
  'BANKING',
  null,
  { backgroundColor: "#16a766", textColor: "#ffffff" }
);
```

### Creating a Manager Label
```javascript
const managerLabel = await createLabelOrFolder(
  'gmail',
  accessToken,
  'MANAGER/John Smith',
  null,
  { backgroundColor: "#ffad47", textColor: "#000000" }
);
```

## Label ID Format
Gmail assigns unique IDs to labels in the format:
- `Label_[NUMBER]` for user-created labels
- System labels have predefined IDs (INBOX, SENT, DRAFTS, etc.)

## Notes
- Gmail labels are case-sensitive
- Maximum label name length: 225 characters
- Colors must be valid hex color codes
- Labels can be nested using slash notation
- System labels cannot be modified or deleted

