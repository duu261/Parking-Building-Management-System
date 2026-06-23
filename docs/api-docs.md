# ParkMaster API Documentation

**Freshness Date:** 2026-06-24  
**Base URL:** `http://localhost:5000/api` (development) or deployed instance

## Overview

ParkMaster is a Parking Building Management System built with Spring Boot 3 and PostgreSQL. The API uses JWT-based authentication (Bearer tokens in `Authorization` header) and role-based access control (ADMIN, MANAGER, STAFF, USER/DRIVER, Guest).

All API responses follow the RFC7807 problem detail format for errors. Timestamps are in ISO 8601 format.

---

## Authentication

### Register

```
POST /api/auth/register
```

Create a new user account.

**Request Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters, max 100 |
| fullName | string | Yes | User's full name, max 120 chars |

**Response:** `201 Created`
| Field | Type |
|-------|------|
| accessToken | string |
| id | number |
| email | string |
| fullName | string |
| role | string (ADMIN, MANAGER, STAFF, USER) |

**Example:**
```json
{
  "email": "driver@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

---

### Login

```
POST /api/auth/login
```

Authenticate and retrieve JWT token.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response:** `200 OK`
Same structure as Register response.

---

### Forgot Password

```
POST /api/auth/forgot-password
```

Request a password reset (backend sends email token).

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |

**Response:** `200 OK`
| Field | Type |
|-------|------|
| message | string |

---

### Reset Password

```
POST /api/auth/reset-password
```

Reset password using token from email.

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| token | string | Yes |
| newPassword | string | Yes | Minimum 8 characters |

**Response:** `200 OK`
| Field | Type |
|-------|------|
| message | string |

---

## Admin APIs

### List All Users

```
GET /api/admin/users
Authorization: Bearer <token>
```

**Required Role:** ADMIN

**Response:** `200 OK` - Array of UserSummary objects
| Field | Type |
|-------|------|
| id | number |
| email | string |
| fullName | string |
| role | string |
| active | boolean |

---

### Create User

```
POST /api/admin/users
Authorization: Bearer <token>
```

**Required Role:** ADMIN

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |
| fullName | string | Yes |
| role | string | Yes | (ADMIN, MANAGER, STAFF, USER) |

**Response:** `201 Created` - UserSummary

---

### Change User Role

```
PATCH /api/admin/users/{id}/role
Authorization: Bearer <token>
```

**Required Role:** ADMIN

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| role | string | Yes |

**Response:** `200 OK` - UserSummary

---

### Set User Active/Inactive

```
PATCH /api/admin/users/{id}/active
Authorization: Bearer <token>
```

**Required Role:** ADMIN

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| active | boolean | Yes |

**Response:** `200 OK` - UserSummary

---

## Driver APIs (User Profile)

All driver endpoints require `Authorization: Bearer <token>` and role USER.

### Get My Profile

```
GET /api/driver/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`
| Field | Type |
|-------|------|
| id | number |
| email | string |
| fullName | string |
| role | string |
| active | boolean |

---

### Update My Profile

```
PUT /api/driver/profile
Authorization: Bearer <token>
```

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| fullName | string | No |

**Response:** `200 OK` - Updated profile

---

### Change Password

```
POST /api/driver/profile/change-password
Authorization: Bearer <token>
```

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| currentPassword | string | Yes |
| newPassword | string | Yes | Minimum 8 characters, max 100 |

**Response:** `200 OK`
| Field | Type |
|-------|------|
| message | string |

---

## Manager APIs

### Parking Management

#### Create Building

```
POST /api/manager/buildings
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |
| address | string | Yes |

**Response:** `201 Created`
| Field | Type |
|-------|------|
| id | number |
| name | string |
| address | string |

---

#### List Buildings

```
GET /api/manager/buildings
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of BuildingResponse

---

#### Get Building

```
GET /api/manager/buildings/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - BuildingResponse

---

#### Update Building

```
PUT /api/manager/buildings/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type |
|-------|------|
| name | string |
| address | string |

**Response:** `200 OK` - BuildingResponse

---

#### Delete Building

```
DELETE /api/manager/buildings/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `204 No Content`

---

### Floor Management

#### Create Floor

```
POST /api/manager/buildings/{buildingId}/floors
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |
| level | number | Yes |

**Response:** `201 Created` - FloorResponse

---

#### List Floors

```
GET /api/manager/buildings/{buildingId}/floors
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of FloorResponse

---

#### Set Floor Vehicle Type

```
PATCH /api/manager/floors/{id}/vehicle-type
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| vehicleTypeId | number | Yes |

**Response:** `200 OK` - FloorResponse

---

#### Delete Floor

```
DELETE /api/manager/floors/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `204 No Content`

---

#### Get Allocation Analytics

```
GET /api/manager/buildings/{buildingId}/analytics/allocation
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - AllocationAnalytics

---

### Slot Management

#### Create Slot

```
POST /api/manager/floors/{floorId}/slots
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| code | string | Yes | Unique slot identifier |

**Response:** `201 Created` - SlotResponse

---

#### List Slots

```
GET /api/manager/floors/{floorId}/slots
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of SlotResponse

---


#### Update Slot Status

```
PATCH /api/manager/slots/{id}/status
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| status | string | Yes | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, LOCKED |

**Response:** `200 OK` - SlotResponse

---

#### Delete Slot

```
DELETE /api/manager/slots/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `204 No Content`

---

### Pricing Management

#### Create Vehicle Type

```
POST /api/manager/vehicle-types
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |

**Response:** `201 Created` - VehicleTypeResponse

---

#### List Vehicle Types

```
GET /api/manager/vehicle-types
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of VehicleTypeResponse

---

#### Get Vehicle Type

```
GET /api/manager/vehicle-types/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - VehicleTypeResponse

---

#### Update Vehicle Type

```
PUT /api/manager/vehicle-types/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type |
|-------|------|
| name | string |

**Response:** `200 OK` - VehicleTypeResponse

---

#### Delete Vehicle Type

```
DELETE /api/manager/vehicle-types/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `204 No Content`

---

#### Set Pricing Policy

```
PUT /api/manager/vehicle-types/{vehicleTypeId}/pricing
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| hourlyRate | number | Yes |
| dailyCap | number | Yes |
| gracePeriod | number | No | Minutes |
| penaltyPerDay | number | No |

**Response:** `200 OK` - PricingPolicyResponse

---

#### Get Pricing Policy

```
GET /api/manager/vehicle-types/{vehicleTypeId}/pricing
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - PricingPolicyResponse

---

#### Delete Pricing Policy

```
DELETE /api/manager/vehicle-types/{vehicleTypeId}/pricing
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `204 No Content`

---

#### List All Pricing Policies

```
GET /api/manager/pricing
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of PricingPolicyResponse

---

### Monthly Pass Management

#### Issue Pass

```
POST /api/manager/passes
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| vehicleTypeId | number | Yes |
| licensePlate | string | Yes |
| validFrom | date | Yes | ISO 8601 format |
| validUntil | date | Yes |

**Response:** `201 Created` - PassResponse

---

#### List Passes

```
GET /api/manager/passes
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of PassResponse

---

#### Get Pass

```
GET /api/manager/passes/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - PassResponse

---

#### Revoke Pass

```
DELETE /api/manager/passes/{id}
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - PassResponse with status REVOKED

---

#### Activate Pass

```
PATCH /api/manager/passes/{id}/activate
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - PassResponse

---

### Payment Management

#### Get Revenue Summary

```
GET /api/manager/payments/revenue
Authorization: Bearer <token>
?from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| from | datetime | Yes | ISO 8601 format |
| to | datetime | Yes |

**Response:** `200 OK` - RevenueResponse
| Field | Type |
|-------|------|
| from | datetime |
| to | datetime |
| totalPaid | number |
| count | number |

---

### Exception Management

#### List All Exceptions

```
GET /api/manager/exceptions
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of ExceptionResponse

---

#### List Open Exceptions

```
GET /api/manager/exceptions/open
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of ExceptionResponse

---

#### Resolve Exception

```
POST /api/manager/exceptions/{id}/resolve
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| resolutionNote | string | Yes |

**Response:** `200 OK` - ExceptionResponse

---

### Feedback Management

#### List All Feedback

```
GET /api/manager/feedback
Authorization: Bearer <token>
```

**Required Role:** MANAGER

**Response:** `200 OK` - Array of FeedbackResponse

---

### Reports & Analytics

#### Daily Revenue Report

```
GET /api/manager/reports/revenue-daily
Authorization: Bearer <token>
?from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| from | datetime | No | ISO 8601 format |
| to | datetime | No |

**Response:** `200 OK` - Array of RevenueResponse
| Field | Type |
|-------|------|
| from | datetime |
| to | datetime |
| totalPaid | number |
| count | number |

---

#### Check-ins by Hour Report

```
GET /api/manager/reports/check-ins-by-hour
Authorization: Bearer <token>
?buildingId=1&from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type |
|------|------|
| buildingId | number |
| from | datetime |
| to | datetime |

**Response:** `200 OK` - Analytics data

---

#### Allocation Comparison Report

```
GET /api/manager/reports/allocation-comparison
Authorization: Bearer <token>
?from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| from | datetime | Yes | ISO 8601 format |
| to | datetime | Yes |

**Response:** `200 OK` - Allocation comparison data

---

#### Parking Duration by Vehicle Type Report

```
GET /api/manager/reports/duration-by-vehicle-type
Authorization: Bearer <token>
?from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| from | datetime | Yes | ISO 8601 format |
| to | datetime | Yes |

**Response:** `200 OK` - Duration breakdown by vehicle type

---

#### Revenue by Vehicle Type Report

```
GET /api/manager/reports/revenue-by-vehicle-type
Authorization: Bearer <token>
?from=2026-06-01T00:00:00Z&to=2026-06-24T23:59:59Z
```

**Required Role:** MANAGER

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| from | datetime | Yes | ISO 8601 format |
| to | datetime | Yes |

**Response:** `200 OK` - Revenue breakdown by vehicle type

---

## Staff APIs

### Lookups

#### List Vehicle Types

```
GET /api/staff/vehicle-types
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of VehicleTypeResponse

---

#### List Buildings

```
GET /api/staff/buildings
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of BuildingResponse

---

#### List Floors

```
GET /api/staff/buildings/{buildingId}/floors
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of FloorResponse

---

#### List Slots

```
GET /api/staff/floors/{floorId}/slots
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of SlotResponse

---

#### Lookup Pass by License Plate

```
GET /api/staff/pass-lookup?plate=ABC123
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| plate | string | Yes |

**Response:** `200 OK` - PassResponse (if active pass exists)

---

### Session Management

#### Check In

```
POST /api/staff/sessions/check-in
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Request Body:** (Choose ONE of the following)
| Field | Type | Usage |
|-------|------|-------|
| slotId | number | Manual slot selection |
| buildingId + vehicleTypeId | number | Auto-allocate |
| reservationId | number | Consume reservation |
| licensePlate | string | Required for all |

**Response:** `201 Created` - SessionResponse

---

#### Check Out

```
POST /api/staff/sessions/{id}/check-out
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - SessionResponse

---

#### List Active Sessions

```
GET /api/staff/sessions/active
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of SessionResponse

---

#### Get Session

```
GET /api/staff/sessions/{id}
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - SessionResponse

---

#### Get Session by Ticket Code

```
GET /api/staff/sessions/by-ticket/{ticketCode}
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - SessionResponse

---

#### List Sessions by Plate

```
GET /api/staff/sessions/by-plate?plate=ABC123
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Query Parameters:**
| Name | Type | Required |
|------|------|----------|
| plate | string | Yes |

**Response:** `200 OK` - Array of SessionResponse

---

#### Get Ticket QR Code

```
GET /api/staff/sessions/{id}/ticket.png
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - PNG image (QR code)

---

### Payment Management

#### List Pending Payments

```
GET /api/staff/payments/pending
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of PaymentResponse

---

#### Get Payment

```
GET /api/staff/payments/{id}
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - PaymentResponse

---

#### Settle Payment

```
POST /api/staff/payments/{id}/settle
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| method | string | Yes | CASH or ONLINE |

**Response:** `200 OK` - PaymentResponse

---

#### Void Payment

```
POST /api/staff/payments/{id}/void
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| reason | string | Yes |

**Response:** `200 OK` - PaymentResponse

---

### Exception Reporting

#### Create Exception Report

```
POST /api/staff/exceptions
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| type | string | Yes | LOST_TICKET, WRONG_PLATE, OVERTIME, WRONG_ZONE |
| description | string | Yes |
| sessionId | number | No |

**Response:** `201 Created` - ExceptionResponse

---

#### List Open Exceptions

```
GET /api/staff/exceptions/open
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - Array of ExceptionResponse

---

#### Get Exception

```
GET /api/staff/exceptions/{id}
Authorization: Bearer <token>
```

**Required Role:** STAFF

**Response:** `200 OK` - ExceptionResponse

---

## Driver APIs (Self-Service)

All driver endpoints require `Authorization: Bearer <token>` and role USER.

### Sessions

#### List My Sessions

```
GET /api/driver/sessions
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of SessionResponse

---

#### Get My Session

```
GET /api/driver/sessions/{id}
Authorization: Bearer <token>
```

**Response:** `200 OK` - SessionResponse

---

#### Get My Ticket QR

```
GET /api/driver/sessions/{id}/ticket.png
Authorization: Bearer <token>
```

**Response:** `200 OK` - PNG image (QR code)

---

### Monthly Passes

#### List My Passes

```
GET /api/driver/passes
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of PassResponse

---

#### Register Pass

```
POST /api/driver/passes
Authorization: Bearer <token>
```

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| vehicleTypeId | number | Yes |
| licensePlate | string | Yes |
| validFrom | date | Yes | ISO 8601 format |
| validUntil | date | Yes |

**Response:** `200 OK` - PassResponse

---

#### Get Pass QR Code

```
GET /api/driver/passes/{id}/qr.png
Authorization: Bearer <token>
```

**Response:** `200 OK` - PNG image (QR code)

---

### Payments

#### List My Payments

```
GET /api/driver/payments
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of PaymentResponse

---

#### Pay (Cash/Online)

```
POST /api/driver/payments/{id}/pay
Authorization: Bearer <token>
```

**Response:** `200 OK` - PaymentResponse (status: PENDING for online)

---

#### Start VNPay Checkout

```
POST /api/driver/payments/{id}/vnpay
Authorization: Bearer <token>
```

**Response:** `200 OK`
| Field | Type |
|-------|------|
| paymentUrl | string | URL to redirect for checkout |

---

### Reservations

#### Create Reservation

```
POST /api/driver/reservations
Authorization: Bearer <token>
```

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| buildingId | number | Yes |
| vehicleTypeId | number | Yes |
| licensePlate | string | Yes |

**Response:** `201 Created` - ReservationResponse

---

#### List My Reservations

```
GET /api/driver/reservations
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of ReservationResponse

---

#### Cancel Reservation

```
POST /api/driver/reservations/{id}/cancel
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

#### Get Reservation QR Code

```
GET /api/driver/reservations/{id}/qr.png
Authorization: Bearer <token>
```

**Response:** `200 OK` - PNG image (QR code)

---

### Feedback

#### Submit Feedback

```
POST /api/driver/feedback
Authorization: Bearer <token>
```

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| rating | number | Yes | 1-5 |
| message | string | No |
| topic | string | No | Category/subject |

**Response:** `200 OK` - FeedbackResponse

---

#### List My Feedback

```
GET /api/driver/feedback
Authorization: Bearer <token>
```

**Response:** `200 OK` - Array of FeedbackResponse

---

## Public APIs (No Authentication)

### Health Check

```
GET /api/public/health
```

**Response:** `200 OK`
| Field | Type |
|-------|------|
| status | string |
| service | string |
| time | datetime |

---

### Buildings

#### List Buildings

```
GET /api/public/buildings
```

**Response:** `200 OK` - Array of BuildingResponse

---

#### Get Building Availability

```
GET /api/public/buildings/{id}/availability
```

**Response:** `200 OK`
| Field | Type |
|-------|------|
| totalSlots | number |
| availableSlots | number |
| filledRate | number | Percentage |

---

#### List Floors

```
GET /api/public/buildings/{id}/floors
```

**Response:** `200 OK` - Array of FloorResponse

---

#### List Slots

```
GET /api/public/floors/{floorId}/slots
```

**Response:** `200 OK` - Array of SlotResponse

---

### Pricing

#### List Pricing Policies

```
GET /api/public/pricing
```

**Response:** `200 OK` - Array of PricingPolicyResponse
| Field | Type |
|-------|------|
| vehicleTypeId | number |
| vehicleTypeName | string |
| hourlyRate | number |
| dailyCap | number |
| gracePeriod | number |
| penaltyPerDay | number |

---

### Payment Callback

#### VNPay Callback Handler

```
GET /api/public/payments/vnpay-return
```

**Query Parameters:**
VNPay callback parameters (vnp_*)

**Response:** `302 Found` - Redirect to frontend result page

**Notes:** No JWT required. VNPay/browser hits this endpoint directly to report payment outcome. Verifies signature, updates payment status, then redirects to `/my-passes` or `/sessions` with status and reference parameters.

---

### AI Slot Allocation Preview

#### Get Allocation Preview

```
GET /api/public/buildings/{id}/allocation-preview
?vehicleTypeId=1&limit=6
```

**Query Parameters:**
| Name | Type | Default |
|------|------|---------|
| vehicleTypeId | number | Required |
| limit | number | 6 | Max 12 |

**Response:** `200 OK` - Array of AllocationCandidate
| Field | Type | Notes |
|-------|------|-------|
| slotId | number | Recommended slot |
| slotCode | string | Slot identifier |
| floorName | string | Floor info |
| score | AllocationScore | Breakdown of scoring |

**AllocationScore structure:**
| Field | Type | Notes |
|-------|------|-------|
| vehicleTypeMatch | number | 0-1 score |
| loadBalance | number | 0-1 score |
| distanceToEntry | number | 0-1 score |
| peakHour | number | 0-1 score |
| total | number | Composite score |
| alternativesConsidered | number | Count |

---

### AI Assistant (Chat)

#### Chat with Assistant

```
POST /api/public/assistant/chat
```

**Rate Limit:** 15 requests per minute per IP

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| message | string | Yes |

**Response:** `200 OK`
| Field | Type |
|-------|------|
| message | string | Assistant response |
| timestamp | datetime |

**Error Response (Rate Limited):** `429 Too Many Requests`

---

## Data Models

### Session Status
- `ACTIVE` - Check-in completed, vehicle inside
- `COMPLETED` - Check-out completed
- `VOIDED` - Manually voided

### Payment Status
- `PENDING` - Awaiting payment
- `PAID` - Successfully paid
- `VOIDED` - Cancelled

### Payment Method
- `CASH` - Settled by staff
- `ONLINE` - Paid via system
- `VNPAY` - Paid via VNPay gateway

### Slot Status
- `AVAILABLE` - Empty and ready
- `OCCUPIED` - Vehicle inside
- `RESERVED` - Hold placed
- `MAINTENANCE` - Unavailable
- `LOCKED` - Disabled

### User Role
- `ADMIN` - System administrator
- `MANAGER` - Building/operations manager
- `STAFF` - Check-in/check-out operator
- `USER` - Driver/customer

### Exception Type
- `LOST_TICKET` - Lost parking ticket
- `WRONG_PLATE` - Incorrect license plate
- `OVERTIME` - Overtime charge dispute
- `WRONG_ZONE` - Vehicle in wrong zone

### Pass Status
- `ACTIVE` - Currently valid
- `EXPIRED` - Expiration date passed
- `REVOKED` - Manually cancelled
- `PENDING` - Not yet activated

---

## Error Responses

All error responses follow RFC 7807 problem detail format:

```json
{
  "type": "about:blank",
  "status": 400,
  "title": "Bad Request",
  "detail": "Specific error message"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate/constraint violation) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Authentication Patterns

### Getting Started

1. Call `POST /api/auth/register` to create account
2. Receive `accessToken` in response
3. Use `Authorization: Bearer <accessToken>` header for all protected endpoints
4. Token is valid for configured duration (typically 24 hours)
5. On expiration, call `POST /api/auth/login` to get new token

### Token Refresh

Currently, tokens are long-lived. If expiration is needed, re-authenticate with login endpoint.

---

## Rate Limiting

- **Public Assistant Chat:** 15 requests/minute per IP
- **All other endpoints:** No explicit rate limit (recommend implementing via reverse proxy)

---

## CORS & Security

- API enforces Bearer token authentication on all protected endpoints
- CORS headers allow cross-origin requests from configured frontend URLs
- All user input is validated server-side
- Passwords are hashed using bcrypt
- JWT tokens include role and user ID in claims

---

## Versioning

Current API version: v1 (no version prefix in URLs)

Future versions may use `/api/v2/`, `/api/v3/`, etc.

---

**Last Updated:** 2026-06-24
