.. _create_new_project:

Creating a Fullstack Project
==============================

This part of the guide will walk you through the creation of an AngularJS
project from scratch.  We will use `Grunt`_ as a build tool, and `Yeoman`_ as
a scaffolding tool.

We will use `Node.JS`_ as our backend server, with the Stormpath Express SDK.


Installing Node, Grunt, Bower and Yeoman
----------------------------------------------

If you haven't installed Node.js on your system you can get it from https://nodejs.org.

Then you need to install `Grunt`_, a tool for helping you build your
project.  This must be installed as a global npm package::

    $ npm install -g grunt-cli

The next tool you need is Yeoman_, a is a "scaffolding" tool (it makes it easy to create
repeatable boilerplate code).  This must also be installed as a global NPM package::

    $ npm install -g yo

Finally, we will install `Bower`_, a package manager for front-end applications::

    $ npm install -g bower

.. _Grunt: http://gruntjs.com/
.. _Bower: http://bower.io/
.. _Node.JS: http://nodejs.org/
.. _Yeoman: http://yeoman.io/
.. _Getting Started Guide: http://gruntjs.com/getting-started
.. _UI Router: https://github.com/angular-ui/ui-router



Create an Angular-Fullstack Project
------------------------------------

We are going to use the `Angular Fullstack Generator <https://github.com/DaftMonk/generator-angular-fullstack>`_.
It's going to create a LOT of files for us; essentially, our entire development environment
and the seed files for the client AND server.  This is really amazing!

To use the generator, you need to first install it as a global node module::

    $ npm install -g generator-angular-fullstack

At this point, you should create a directory for your project and change into it::

    $ mkdir my-angular-project && cd $_

Once there, we use the generator to create the project.  We need to give our application a
name (it does not have to be the same as the folder).  Since we are building a basic user
dashboard for our API, we will call it "dashboard"::

    $ yo angular-fullstack dashboard

The generator will ask you several questions, such as which templating engine to use.  We're sticking
to vanilla HTML/CSS/JS for this guide. The only opinionated choice we are making is to use the 3rd-party
`UI Router`_ instead of Angular's default.
Here are the choices that we made::

    # Client

    ? What would you like to write scripts with? JavaScript
    ? What would you like to write markup with? HTML
    ? What would you like to write stylesheets with? CSS
    ? What Angular router would you like to use? uiRouter
    ? Would you like to include Bootstrap? Yes
    ? Would you like to include UI Bootstrap? No

    # Server

    ? Would you like to use mongoDB with Mongoose for data modeling? No

Assuming everything installs OK, you should now have the default project ready to go.  Use this grunt command to start the development server and see the application::

    $ grunt serve

It should automatically open this page in your browser:

.. image:: _static/fullstack-new-project.png

Now would be a good time to start using Git with your project. You can
stop the server by pressing ``Ctrl+C`` - then use these git commands::

    $ git init
    $ git add .
    $ git commit -m "Begin dasbhoard app project"


Install the Stormpath Packages
--------------------------

We need to add two packages to this project: the `Stormpath Express Module`_ and the `Stormpath Angular SDK`_.
Because the Angular SDK is a front-end application, it is managed with `Bower`_.

Install them with these commands, which will also persist them to your ``package.json`` and ``bower.json`` files::

    $ npm install --save express-stormpath
    $ bower install --save stormpath-sdk-angularjs

Upgrade Express
--------------------------

We also want to make sure that we are using the latest version of Express. Run
this command to get the latest::

    $ npm i express@latest --save

In the next section, we will get your Stormpath Tenant information, so that we can
continue with the latter sections.

.. _Stormpath Admin Console: https://api.stormpath.com
.. _Stormpath Angular SDK: https://github.com/stormpath/stormpath-sdk-angularjs
.. _Stormpath Express Module: https://github.com/stormpath/stormpath-express