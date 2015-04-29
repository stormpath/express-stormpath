# Contribution Guide

We love pull requests!

Here are a few things you'll need to know if you want to make a contribution to
this library.

### Development Workflow

All modifications should happen to the source files in the `src/` directory, not
the files minified in the `dist/` directory.  The latter is used for keeping a
minified version of the current, tagged build.  We give this to
[Bower](http://bower.io).

You can submit a PR after modifying the source files.  We will publish a new
version in `dist/` when we are ready to cut a new release.

### API Documentation

The API documentation is auto-generated from the the JS-Doc style comments
that you find in the `src/` files.  Do not edit files in `dist/`.

You can regenerate the API docs by running `grunt docs`.  If you want to
see your changes as you edit them you can use `grunt serve` to start a
livereload server that will reload your changes as you make them.

When editing the JS Doc comments, please follow this order for tags:

```
@ngdoc
@name
@methodOf (or eventOf, etc)
@eventType (if applicable)
@param
@returns
@description
@example
```

After you have made your edits, commit your changes and make a pull request.

And put a newline before and after the line that includes the tag.

### Product Guide Documentation

The source files for the product guide are located in the `docs/source`
directory.  The format is RST and they are compiled by Sphinx.

To work with the product guide, run `grunt guide`.  This will start a livereload
server which reloads the documents as you edit them.

After you have made your edits, commit the changes to the RST files and make
a pull request.