.. _introduction:


Introduction
============

Not sure if Express-Stormpath is for you?  Read along, and I'll help you decide
whether or not Express-Stormpath is a good fit for your project!


What does this library do?
--------------------------

This library will add a user database and authentication system to your application.
It will provide a way for users to create accounts and login to your application
with a username and password.  Your users can have also create API Keys and
OAuth tokens (useful if you are creating an API service).

This library uses `Stormpath`_ as a service, and you will need a `Stormpath`_
account to continue.


You may have noticed that we have another library, the `Stormpath Node SDK`_.
That library is a low-level convenience library for the `Stormpath API`_.  This
Express library will cover most features that you need for your web application,
but if you want to dig deepr into the `Stormpath API`, you may need the
`Stormpath Node SDK`_.


What is Stormpath?
------------------

`Stormpath`_ is a hosted API service for creating and managing user accounts.
Stormpath manages the following tasks for your application:

- Create & Edit user accounts and user data.
- Organize users with groups and roles.
- Store data on user objects.
- Securely store all user data (compliance)
- Customize group permissions (groups, roles, etc.).
- Handle complex authentication and authorization patterns.
- Log users in via social login with `Facebook`_ and `Google`_ OAuth.
- Generate and authenticate OAuth2 password grant tokens.

Stormpath is used as a simple REST API, over HTTP.  This means that we can
operate in almost any software environment.  For instance, if you wanted to
create a new user account  with a given an email address and password, you could
send Stormpath an ``HTTP POST`` request and Stormpath would create a new user
account for you, and store it securely on Stormpath's cloud service.


Who Should Use Stormpath
------------------------

Stormpath is a great service, but it's not for everyone!

You might want to use Stormpath if:

- You want to make user creation, management, and security as simple as possible
  (you can get started with Express-Stormpath with only one line of code
  *excluding settings*)!
- User security is a top priority.  We're known for our security.
- Scaling your userbase is a potential problem (Stormpath handles scaling your
  users transparently).
- You need to store custom user data along with your user's basic information
  (email, password).
- You would like to have automatic email verification for new user accounts.
- You would like to configure and customize password strength rules.
- You'd like to keep your user data separate from your other applications to
  increase platform stability / availability.
- You are building a service oriented application, in which multiple
  independent services need access to the same user data.
- You are a big organization who would like to use Stormpath, but need to host
  it yourself (Stormpath has an on-premise system you can use internally).

**Basically, Stormpath is a great match for applications of any size where
security, speed, and simplicity are top priorities.**

You might **NOT** want to use Stormpath if:

- You are building an application that does not need user accounts.
- Your application is meant for internal-only usage.
- You aren't worried about user data / security much.
- You aren't worried about application availability / redundancy.
- You want to roll your own custom user authentication.

If you don't need Stormpath, you might want to check out `Passport`_ (*another
great project for handling user authentication*).

Want to use Stormpath?  OK, great!  Let's get started!


.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
.. _Stormpath API: https://docs.stormpath.com/rest/product-guide/
.. _Stormpath: https://stormpath.com/
.. _Facebook: https://www.facebook.com/
.. _Google: https://www.google.com/
.. _Passport: http://passportjs.org/
