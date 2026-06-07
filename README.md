# ज्ञानसिंधू क्लासेस - Management System

A mobile-first web application for managing students, teachers, attendance, and marks for coaching classes. Designed to work seamlessly on mobile devices with Google Sheets integration for cloud storage.

## 🌟 Features

### For Admin
- **Dashboard**: Overview of students, teachers, fees, and activity
- **Student Management**: Add, edit, view, and delete student records
- **Teacher Management**: Manage teacher profiles and assigned classes
- **Account Management**: Reset passwords for students and teachers
- **Attendance**: Mark daily attendance for all classes
- **Marks Management**: Enter and track test scores
- **Settings**: Change admin password, export/clear data

### For Teachers
- **Dashboard**: Overview of assigned classes and students
- **Mark Attendance**: Record attendance for assigned classes only
- **Enter Marks**: Add test scores for assigned subjects
- **View Students**: See detailed student information, attendance, and marks

### For Students
- **Dashboard**: Personal overview with attendance and average marks
- **My Attendance**: View attendance history with statistics
- **My Marks**: See all test results with grades
- **Fee Details**: Check fee payment status

## 📱 Mobile-Optimized

- **Touch-friendly UI**: All buttons and inputs sized for mobile interaction
- **Responsive Design**: Adapts to all screen sizes
- **PWA Support**: Install as an app on your mobile device
- **Offline-First**: Works without internet connection
- **No Zoom Issues**: Proper input sizing prevents accidental zoom on iOS

## 🔐 Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `Capital@123`

**Sample Teacher Logins:**
- Username: `sunita` / Password: `Sunita@123`
- Username: `vijay` / Password: `Vijay@123`

**Sample Student Logins:**
- Username: `anand` / Password: `Anand@123`
- Username: `priya` / Password: `Priya@123`
- Username: `rohan` / Password: `Rohan@123`

## ☁️ Google Sheets Integration

The app supports Google Sheets as a cloud database. This allows:
- ✅ Data accessible from any device
- ✅ Automatic cloud backup
- ✅ Data survives browser cache clearing
- ✅ Easy data export to Excel

**Setup Instructions:** See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

## 🚀 Deployment on GitHub Pages

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/Dnyansidhu.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under **Source**, select `main` branch
4. Click **Save**
5. Your site will be live at: `https://yourusername.github.io/Dnyansidhu/`

### Step 3: Access the App

- **Homepage**: `https://yourusername.github.io/Dnyansidhu/`
- **Management System**: `https://yourusername.github.io/Dnyansidhu/app.html`

## 📂 File Structure

```
Dnyansidhu/
├── index.html              # Homepage
├── app.html                # Main management application
├── Logo.jpg                # Institute logo
├── manifest.json           # PWA manifest
├── GOOGLE_SHEETS_SETUP.md  # Google Sheets integration guide
├── README.md               # This file
└── ...other files
```

## 🔧 Configuration

### Updating Admin Password

1. Open `app.html`
2. Find line ~525: `localStorage.setItem('gs_admin', JSON.stringify({ username: 'admin', password: 'Capital@123' }))`
3. Change `Capital@123` to your desired password
4. Clear browser localStorage or use the app's Settings > Clear All Data

### Customizing Institute Information

Edit the Settings page section in `app.html` (search for "Institute Information"):

```javascript
<p><strong>Name:</strong> ज्ञानसिंधू क्लासेस</p>
<p><strong>Location:</strong> नेरळ</p>
<p><strong>Contact:</strong> 7218432344</p>
```

## 💾 Data Storage

The app uses a **dual-storage system**:

1. **localStorage** (Primary):
   - Instant saves
   - Works offline
   - Stored in browser only

2. **Google Sheets** (Optional):
   - Cloud backup
   - Accessible anywhere
   - Requires configuration

## 📊 Data Export/Import

### Export
1. Login as admin
2. Go to Settings
3. Click "Export All Data"
4. Saves a JSON file with all data

### Import (Manual)
Currently, you need to manually re-enter data or use the Google Sheets sync feature.

## 🛡️ Security Notes

⚠️ **Important:** This app is designed for internal use on a private/trusted network.

- Passwords are stored in **plain text** (localStorage/Google Sheets)
- No encryption is implemented
- Suitable for coaching class/school internal use only
- For production use with sensitive data, implement proper authentication

## 📱 Installing as Mobile App

### On Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

### On iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

## 🐛 Troubleshooting

### Data Not Saving
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing cache and refreshing

### Login Issues
- Clear localStorage: Open browser console and run `localStorage.clear()`
- Refresh the page
- Default admin password is `Capital@123`

### Mobile Display Issues
- Clear browser cache
- Try a different browser
- Check if JavaScript is enabled

### Google Sheets Sync Not Working
- See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)
- Check API key restrictions
- Verify spreadsheet sharing settings

## 🔄 Updates and Maintenance

### Updating the App
1. Make changes to `app.html`
2. Commit and push to GitHub
3. Changes will be live in a few minutes
4. Users should refresh their browsers

### Backup Strategy
1. **Weekly**: Export all data (Settings > Export All Data)
2. **Monthly**: Download Google Sheets as Excel backup
3. Store backups in a safe location

## 📞 Support

For questions or issues:
- Contact: 7218432344
- Check browser console for error messages
- Review GOOGLE_SHEETS_SETUP.md for sync issues

## 📝 License

This project is created for internal use by ज्ञानसिंधू क्लासेस.

## 🙏 Credits

Developed for coaching class management with focus on simplicity and mobile-first design.

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-07
