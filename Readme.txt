====================================================
  VIBE CODED TASK MANAGER
  Quick-Start Guide for Windows Users
====================================================

Welcome! This guide will help you run the Vibe Coded
Task Manager on your Windows computer in just a few
clicks — no technical knowledge required.


----------------------------------------------------
 WHAT IS THIS APP?
----------------------------------------------------

Vibe Coded Task Manager is a simple, free task
management app that runs entirely on YOUR computer.
Your data stays private — nothing is sent to the
internet.

You can:
  - Create and organise tasks
  - Set priorities (Low / Medium / High)
  - Track status (To Do / In Progress / Done)
  - Add due dates and tags
  - Search and filter your tasks


----------------------------------------------------
 SYSTEM REQUIREMENTS
----------------------------------------------------

  - Windows 10 or Windows 11
  - Internet connection (for first-time setup only)
  - A web browser (Chrome, Edge, Firefox, etc.)


----------------------------------------------------
 HOW TO START THE APP (ONE CLICK)
----------------------------------------------------

1. Download or copy the whole "vibeCodedTaskManager"
   folder to your computer (e.g. Desktop or Documents).

2. Open the folder.

3. Double-click the file called:

       start.bat

   > If Windows asks "Do you want to run this file?",
     click "Run" or "Yes".

   > If you see a blue SmartScreen warning, click
     "More info" then "Run anyway". This is safe.

4. A black window (Command Prompt) will open and set
   things up automatically. On first run it may take
   1–3 minutes.

5. Your web browser will open automatically and show
   the Task Manager app at:

       http://localhost:5173

That's it! The app is now running.


----------------------------------------------------
 STOPPING THE APP
----------------------------------------------------

When you are finished using the app:

  - Close the black Command Prompt window, OR
  - Click inside the black window and press Ctrl+C

Your tasks are saved automatically in your browser.


----------------------------------------------------
 STARTING AGAIN LATER
----------------------------------------------------

Every time you want to use the app:

  1. Open the "vibeCodedTaskManager" folder.
  2. Double-click "start.bat".
  3. Your browser will open the app automatically.

(After the first run, startup takes only a few
seconds because the setup is already done.)


----------------------------------------------------
 FIRST-RUN: NODE.JS INSTALLATION
----------------------------------------------------

The app needs a small free program called Node.js
to run. "start.bat" checks for it automatically:

  - If Node.js is already on your computer:
      Nothing extra happens — the app starts right away.

  - If Node.js is NOT installed:
      "start.bat" will download and install it for you.
      You may see a Windows security (UAC) pop-up
      asking for permission — click "Yes" to allow it.

      After installation, close the black window and
      double-click "start.bat" one more time to start
      the app.


----------------------------------------------------
 FREQUENTLY ASKED QUESTIONS
----------------------------------------------------

Q: Is my data safe?
A: Yes. Everything is saved locally in your browser
   (localStorage). Nothing is uploaded anywhere.

Q: Can I use this without internet after setup?
A: Yes! Once set up, the app works completely offline.

Q: Where are my tasks saved?
A: In your browser's local storage. They stay there
   as long as you use the same browser on the same
   computer.

Q: What if the browser doesn't open automatically?
A: Open your browser manually and go to:
       http://localhost:5173

Q: Can I run multiple copies at the same time?
A: No. Only run one instance of start.bat at a time.

Q: What if I see an error about "npm install failed"?
A: Make sure you have an internet connection and
   try double-clicking start.bat again.

Q: How do I update the app?
A: Download the latest version, replace the folder,
   and double-click start.bat again.


----------------------------------------------------
 TROUBLESHOOTING
----------------------------------------------------

Problem: Black window closes immediately.
Fix: Right-click "start.bat" and choose
     "Run as administrator", then try again.

Problem: "Node.js was installed but requires a
          restart of this script."
Fix: Close the window and double-click start.bat
     again — it will start normally the second time.

Problem: Browser shows "This site can't be reached".
Fix: Wait 10 seconds for the server to start, then
     refresh the browser page (press F5).

Problem: Port 5173 is already in use.
Fix: Restart your computer and try start.bat again.


----------------------------------------------------
 LICENCE
----------------------------------------------------

This software is licensed under GPL v3.0.
See the LICENSE file for full details.

Author: DaymareOn
====================================================
