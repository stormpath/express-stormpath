.. _upgrading:


Upgrade Guide
=============

This page contains specific upgrading instructions to help you migrate between
Express-Stormpath releases.


Version 0.5.8 -> Version 0.5.9
------------------------------

**No changes needed!**


Version 0.5.7 -> Version 0.5.8
------------------------------

**No changes needed!**


Version 0.5.6 -> Version 0.5.7
------------------------------

**No changes needed!**


Version 0.5.5 -> Version 0.5.6
------------------------------

**No changes needed!**


Version 0.5.4 -> Version 0.5.5
------------------------------

**No changes needed!**


Version 0.5.3 -> Version 0.5.4
------------------------------

**No changes needed!**


Version 0.5.2 -> Version 0.5.3
------------------------------

**No changes needed!**


Version 0.5.1 -> Version 0.5.2
------------------------------

**No changes needed!**


Version 0.5.0 -> Version 0.5.1
------------------------------

**No changes needed!**


Version 0.4.9 -> Version 0.5.0
------------------------------

**No changes needed!**


Version 0.4.8 -> Version 0.4.9
------------------------------

**No changes needed!**


Version 0.4.7 -> Version 0.4.8
------------------------------

**No changes needed!**


Version 0.4.6 -> Version 0.4.7
------------------------------

**No changes needed!**


Version 0.4.5 -> Version 0.4.6
------------------------------

**No changes needed!**


Version 0.4.4 -> Version 0.4.5
------------------------------

**No changes needed!**


Version 0.4.3 -> Version 0.4.4
------------------------------

**No changes needed!**


Version 0.4.2 -> Version 0.4.3
------------------------------

- Please upgrade to version 0.4.4 -- this version contains a bug with our user
  middleware which causes permission assertion to always fail.


Version 0.4.1 -> Version 0.4.2
------------------------------

**No changes needed!**


Version 0.4.0 -> Version 0.4.1
------------------------------

**No changes needed!**


Version 0.3.4 -> Version 0.4.0
------------------------------

**No changes needed!**


Version 0.3.3 -> Version 0.3.4
------------------------------

**No changes needed!**


Version 0.3.2 -> Version 0.3.3
------------------------------

**No changes needed!**


Version 0.3.1 -> Version 0.3.2
------------------------------

**No changes needed!**


Version 0.3.0 -> Version 0.3.1
------------------------------

**No changes needed!**


Version 0.2.9 -> Version 0.3.0
------------------------------

**No changes needed!**


Version 0.2.8 -> Version 0.2.9
------------------------------

**No changes needed!**


Version 0.2.7 -> Version 0.2.8
------------------------------

**No changes needed!**


Version 0.2.6 -> Version 0.2.7
------------------------------

**No changes needed!**


Version 0.2.5 -> Version 0.2.6
------------------------------

**No changes needed!**


Version 0.2.4 -> Version 0.2.5
------------------------------

**No changes needed!**


Version 0.2.3 -> Version 0.2.4
------------------------------

**No changes needed!**


Version 0.2.2 -> Version 0.2.3
------------------------------

**No changes needed!**


Version 0.2.1 -> Version 0.2.2
------------------------------

**No changes needed!**


Version 0.2.0 -> Version 0.2.1
------------------------------

**No changes needed!**


Version 0.1.9 -> Version 0.2.0
------------------------------

If you were previously relying on the built-in CSRF validation in your pages,
you'll need to include CSRF manually.  This release no longer includes CSRF
token protection on *all* pages -- it only protects the Stormpath pages --
this was done to be less confusing for users.

To add CSRF protection to your site similar to what was included automatically
before, you'll want to use the express-csurf library, which you can find on
Github here: https://github.com/expressjs/csurf


Version 0.1.8 -> Version 0.1.9
------------------------------

**No changes needed!**


Version 0.1.7 -> Version 0.1.8
------------------------------

**No changes needed!**


Version 0.1.6 -> Version 0.1.7
------------------------------

**No changes needed!**


Version 0.1.5 -> Version 0.1.6
------------------------------

**No changes needed!**


Version 0.1.4 -> Version 0.1.5
------------------------------

**No changes needed!**


Version 0.1.3 -> Version 0.1.4
------------------------------

**No changes needed!**


Version 0.1.2 -> Version 0.1.3
------------------------------

**No changes needed!**


Version 0.1.0 -> Version 0.1.2
------------------------------

**No changes needed!**


Version 0.0.0 -> Version 0.1.0
------------------------------

**No changes needed!**
