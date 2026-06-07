# Quick Start Guide for Admin

Welcome to the ज्ञानसिंधू क्लासेस Management System! This guide will help you get started quickly.

## 📱 First Time Setup

### Step 1: Access the Application
- Open: `https://yourusername.github.io/Dnyansidhu/app.html`
- Or click "व्यवस्थापन पॅनेल" from the homepage

### Step 2: Login as Admin
- Username: `admin`
- Password: `Capital@123`
- Click "लॉगिन करा"

### Step 3: Add Your First Student
1. Click "विद्यार्थी (Students)" in the sidebar
2. Click "Add Student" button
3. Fill in the details:
   - Name (Marathi/English)
   - Father's Name
   - Phone Number
   - Class (8, 9, 10, 11-science, etc.)
   - **Username** (student will use this to login)
   - **Password** (student's initial password)
   - Fee Amount
   - Fee Paid (how much paid so far)
4. Click "Save"

### Step 4: Add Your First Teacher
1. Click "शिक्षक (Teachers)" in the sidebar
2. Click "Add Teacher" button
3. Fill in the details:
   - Name
   - Phone Number
   - Subject (what they teach)
   - **Username** (teacher will use this to login)
   - **Password** (teacher's initial password)
   - **Assigned Classes** (comma-separated: 9,10,11-science)
4. Click "Save"

## 📝 Daily Tasks

### Mark Attendance
1. Go to "उपस्थिती (Attendance)"
2. Select today's date (auto-filled)
3. Select class
4. Click "Load Students"
5. Mark Present/Absent for each student
6. Click "Save Attendance"

### Enter Marks
1. Go to "गुण/निकाल (Marks)"
2. Select class
3. Enter test details:
   - Test Name (e.g., "First Term", "Unit Test 1")
   - Subject (e.g., "गणित", "विज्ञान")
   - Total Marks (e.g., 100)
   - Date
4. Click "Load Students"
5. Enter marks for each student
6. Click "Save Marks"

## 🔐 Managing User Accounts

### Reset Student/Teacher Password
1. Go to "खाती व्यवस्थापन (Account Management)"
2. Choose Students or Teachers tab
3. Find the user
4. Click "Reset Password"
5. Enter new password
6. Click "Reset"

### Change Admin Password
1. Go to "सेटिंग्ज (Settings)"
2. Enter current password: `Capital@123`
3. Enter new password
4. Confirm new password
5. Click "Change Password"

## 💾 Data Management

### Export Data (Backup)
1. Go to "सेटिंग्ज (Settings)"
2. Click "Export All Data"
3. A JSON file will download
4. Store this safely!

### Clear All Data (Use Carefully!)
1. Go to "सेटिंग्ज (Settings)"
2. Click "Clear All Data"
3. Confirm twice
4. All data will be deleted
5. Only use this to start fresh

## 📊 Viewing Reports

### Student-wise Report
1. Go to "विद्यार्थी (Students)"
2. Click 👁️ (eye icon) next to student name
3. See all details: fees, contact info

### Fee Status
- Dashboard shows:
  - Total fees collected
  - Number of pending fee students
- Filter students by fee status:
  - Go to Students page
  - Use "Fee Status" dropdown

### Attendance Summary
- Go to "उपस्थिती (Attendance)"
- Scroll to "Past Attendance Records"
- See date-wise present/absent counts

### Marks Summary
- Go to "गुण/निकाल (Marks)"
- Scroll to "Past Results"
- See all recorded tests

## 🔍 Search and Filter

### Search Students
- Go to Students page
- Use search box to find by name
- Use dropdowns to filter by:
  - Class
  - Fee Status

## 📱 Mobile Tips

### Install as App
**Android:**
1. Open app in Chrome
2. Menu (⋮) > "Add to Home screen"

**iPhone:**
1. Open app in Safari
2. Share button > "Add to Home Screen"

### For Best Experience
- Use in portrait mode
- Keep browser updated
- Enable JavaScript
- Allow notifications (future feature)

## ⚠️ Important Notes

### Data Storage
- Data is stored in your browser (localStorage)
- **Backup regularly** using Export Data
- Consider setting up Google Sheets sync (see GOOGLE_SHEETS_SETUP.md)

### Sample Data
- The app comes with 3 sample students and 2 sample teachers
- You can delete these after adding your real data

### Security
- Change admin password immediately!
- Use strong passwords for all accounts
- Don't share admin credentials

## 🆘 Common Issues

### "Data not saving"
- Check if localStorage is enabled in browser
- Try clearing cache and reloading
- Export data first, then try again

### "Can't login"
- Make sure username/password are correct
- Check if Caps Lock is on
- Admin password is: `Capital@123`

### "Students not showing in attendance"
- Make sure students are added first
- Check if correct class is selected
- Try refreshing the page

### "Mobile display issues"
- Clear browser cache
- Try different browser (Chrome recommended)
- Check internet connection

## 📞 Need Help?

**Contact:** 7218432344

**Common Questions:**
1. **How to add more classes?** Edit the dropdown options in app.html
2. **Can I edit attendance after saving?** Currently no, be careful when marking
3. **How to bulk import students?** Use Google Sheets sync feature
4. **Can parents see student data?** Not in current version (future feature)

## ✅ Checklist for First Day

- [ ] Login as admin
- [ ] Change admin password
- [ ] Add all teachers
- [ ] Add all students
- [ ] Test: Mark attendance for one class
- [ ] Test: Enter marks for one test
- [ ] Export data as backup
- [ ] Share login credentials with teachers and students
- [ ] (Optional) Set up Google Sheets sync

---

**Welcome to ज्ञानसिंधू क्लासेस Management System!**  
You're all set to manage your coaching classes efficiently! 🎉
