Environment variables for Firebase Storage (optional):

- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (use \n for newlines)
- FIREBASE_STORAGE_BUCKET (e.g., your-project.appspot.com)

If not configured, uploads will be processed but file storage URL will be empty.

## Chatbot API and Gemini setup

Set the following environment variable for the chatbot to work:

```
GEMINI_API_KEY=your_google_generative_ai_api_key
```

On Render, this key is defined in `render.yaml` as a synced secret. Ensure it is set in the Render Dashboard if `sync: false`.

# KMRL Fleet Optimization Platform - Backend

A comprehensive Node.js backend for the Kochi Metro Rail Limited Fleet Optimization Platform, built with Express, TypeScript, and MongoDB.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (user, admin, supervisor)
- Protected route middleware

### 📊 Data Processing
- CSV/Excel file upload with Multer
- Google Sheets integration
- Data validation and processing
- 6-factor optimization scoring system

### 🎯 Optimization Engine
- Train optimization scoring (0-100)
- 6-factor analysis: Fitness, Job Card, Branding, Mileage, Cleaning, Geometry
- Historical data tracking
- Performance comparison

### 🚨 Alerts & Notifications
- Critical issue detection
- Supervisor alerts
- Alert management system
- Auto-generated alerts

### 🔮 Digital Twin
- Current schedule visualization
- What-if scenario simulation
- Impact analysis
- Recommendations engine

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change password

### Data Upload
- `POST /api/upload/data` - Upload CSV/Excel files
- `POST /api/upload/google-sheet` - Import from Google Sheets

### Optimization
- `GET /api/optimization/today` - Get today's optimization results
- `GET /api/optimization/history` - Get optimization history
- `GET /api/optimization/compare` - Compare today vs yesterday
- `POST /api/optimization/simulate` - Run optimization simulation
- `GET /api/optimization/fleet-status` - Get fleet status

### Alerts
- `GET /api/alerts` - Get alerts with filtering
- `POST /api/alerts` - Create new alert (admin/supervisor)
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `POST /api/alerts/mark-all-read` - Mark all alerts as read
- `POST /api/alerts/auto-generate` - Generate sample alerts

### Digital Twin
- `GET /api/digital-twin/current-schedule` - Get current induction schedule
- `POST /api/digital-twin/simulate` - Run what-if simulation
- `GET /api/digital-twin/scenarios` - Get predefined scenarios

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

   **Quick setup with your MongoDB Atlas:**
   ```bash
   # Create .env file with the following content:
   echo "MONGODB_URI=mongodb+srv://manikandan:Mani19200503@cluster0.cuh1ybv.mongodb.net/kmrl-fleet" > .env
   echo "JWT_SECRET=kmrl-fleet-optimization-super-secret-jwt-key-2024" >> .env
   echo "PORT=3001" >> .env
   echo "NODE_ENV=development" >> .env
   echo "CORS_ORIGIN=http://localhost:3000" >> .env
   ```

4. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/kmrl-fleet
DB_NAME=kmrl-fleet

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info

# Gemini (Chat Assistant)
GEMINI_API_KEY=your_google_gemini_api_key
```

## Data Models

### User
- Authentication and profile information
- Role-based permissions
- Password hashing

### UploadedData
- File upload tracking
- Processed train data
- Validation status

### OptimizationResult
- Daily optimization results
- Train scoring data
- Historical tracking

### Alert
- System alerts and notifications
- Priority levels
- Resolution tracking

## Optimization Engine

The optimization engine calculates scores based on 6 factors:

1. **Fitness Certificate** (Weight: 25%) - Safety critical
2. **Job Card Status** (Weight: 20%) - Operational importance
3. **Mileage Balancing** (Weight: 20%) - Efficiency factor
4. **Stabling Geometry** (Weight: 15%) - Operational factor
5. **Cleaning & Detailing** (Weight: 10%) - Passenger experience
6. **Branding Priority** (Weight: 10%) - Aesthetic factor

### Scoring Categories
- **Great** (90-100): Excellent condition
- **Good** (75-89): Good condition
- **OK** (60-74): Acceptable condition
- **Bad** (0-59): Requires attention

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Joi
- Password hashing with bcrypt
- JWT token authentication
- Error handling and logging

## File Upload Support

- **CSV files**: Parsed with Papa Parse
- **Excel files**: Processed with XLSX library
- **Google Sheets**: Direct URL import
- **Validation**: Required columns checking
- **Processing**: Data normalization and scoring

## Digital Twin Features

- **Current Schedule**: Real-time induction schedule
- **What-if Scenarios**: Simulate changes
- **Impact Analysis**: Performance impact calculation
- **Recommendations**: AI-powered suggestions

## Error Handling

- Global error handler
- Structured error responses
- Logging with Winston
- Development vs production error details

## Logging

- Winston logger configuration
- File and console logging
- Error tracking
- Request logging with Morgan

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Documentation

The API follows RESTful conventions with JSON responses:

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team or create an issue in the repository.
