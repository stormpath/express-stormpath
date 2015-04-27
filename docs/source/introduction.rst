.. _introduction:

Introduction
=============

In this guide we will be creating a full-stack JavaScript application.
We will be starting a new project from scratch and we will use the Grunt
and Yeoman tools to take care of the tedious setup.

If you're a seasoned AngularJS developer and simply need to know the
module API, you can visit the `Stormpath AngularJS SDK API Documentation <https://docs.stormpath.com/angularjs/sdk/>`_.
Throughout this guide, we will refer you to the API documentation if you want
to learn more about how we're using it.

While this guide will be JavaScript only, we do have support in our Java
SDK for the same features.  If you are using Java, please see our `Java Web App Plugin Guide`_.

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
* Github: github.com/stormpath
