.. _introduction:

Introduction
=============

The purpose of this guide is to walk you through the creation of an Angular
project from scratch, while showing you how to integrate the
`Stormpath Angular SDK`_ to achieve the following tasks in your Angular
application:

* User Login
* User Registration
* Password Reset
* Access Control

If you're a seasoned AngularJS developer and simply want to explore the
module API, you can visit the `Stormpath AngularJS SDK API Documentation`_.

In this guide we will create a simple API server which our Angular application
will use, using Node.js.  If you wish to create a server using Java, please see
our `Java Web App Plugin Guide`_.  For other environments please visit
`Stormpath Docs`_ to see if we have an integration for you!

.. _Stormpath Docs: https://docs.stormpath.com

.. _Stormpath Angular SDK: https://github.com/stormpath/stormpath-sdk-angularjs

.. _Stormpath AngularJS SDK API Documentation: https://docs.stormpath.com/angularjs/sdk/

.. _Java Web App Plugin Guide: https://docs.stormpath.com/java/servlet-plugin/


What We're Building
--------------------

Let's quickly cover what we'll be building:

**A fullstack project**.  We're going to create a project with a lot of boilerplate code, but don't worry, it's going to be created automatically for you!  This is the power of Yeoman.

**A Node.js server**.  This server will serve the assets for the AngularJS application.  It will also serve a simple API, which we will secure with Stormpath.

**An AngularJS application**.  This will be an HTML5-based application, which allows users to register, login, and see their profile.  We will control profile access, so that only logged-in users can access that view.


How to get Support
-------------------
Getting stuck?  Stormpath is a developer-focused platform.  We want to hear from you!  Reach
us anytime through one of the following channels:

* Email support: support@stormpath.com
* Our knowledgebase: https://support.stormpath.com/hc/en-us
* Github: https://github.com/stormpath/stormpath-sdk-angularjs
