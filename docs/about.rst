.. _about:


About
=====

Not sure if Express-Stormpath is for you?  Read along, and I'll help you decide
whether or not Express-Stormpath is a good fit for your project!


What is Stormpath?
------------------

`Stormpath`_ is an API service for creating and managing user accounts.
Stormpath allows you to do things like:

- Create user accounts.
- Edit user accounts.
- Store user data with each account.
- Create groups and roles.
- Assign users various permissions (groups, roles, etc.).
- Handle complex authentication and authorization patterns.
- Log users in via social login with `Facebook`_ and `Google`_ OAuth.
- Cache user information for quick access.
- Scale your application as you get more users.
- Securely store your users and user data in a central location.

In the backend, what Stormpath does is provide a simple REST API for storing
user accounts.  For instance, if you wanted to create a new user account given
an email address and password, you could send Stormpath an ``HTTP POST`` request
and Stormpath would create a new user account for you, and store it securely on
Stormpath's cloud service.

In addition to allowing you to create users, Stormpath also allows you to store
custom data with each user account.  Let's say you want to store a user's
birthday -- you can send Stormpath an ``HTTP POST`` request to the user's
account and store *any* variable JSON data (birthdays, images, movies, links,
etc.).  This information is encrypted in transit and at rest, ensuring your
user data is secure.


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


.. _Stormpath: https://stormpath.com/
.. _Facebook: https://www.facebook.com/
.. _Google: https://www.google.com/
.. _Passport: http://passportjs.org/
