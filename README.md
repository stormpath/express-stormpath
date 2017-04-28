# Stormpath is Joining Okta

We are incredibly excited to announce that [Stormpath is joining forces with Okta](https://stormpath.com/blog/stormpaths-new-path?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement). Please visit [the Migration FAQs](https://stormpath.com/oktaplusstormpath?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement) for a detailed look at what this means for Stormpath users.

We're available to answer all questions at [support@stormpath.com](mailto:support@stormpath.com).

## What does this mean for developers who are using this library?

* We are patching this library to work with the Okta API. This will come in the form of a major release, 4.0. We're trying hard to minimize the number of breaking changes. This version will assume that you're migrating your data with our data migration tool, which should be available by the end of April.

* We are creating 4.x release candidates as we work.  The [4.x changelog][] will describe all of the changes in this version.

* The [Express-Stormpath Sample Project] is updated to use the latest release candidate, we suggest that you try running this application to ensure that your new Okta org is setup properly.

* Once you are able to run the sample project, we suggest trying the latest release candidate in a local/development copy of your application, and walk through the changes in the [4.x changelog][] to see if you run into any issues.  The latest release candidate can be installed like so:

  ```bash
  npm install --save express-stormpath@next
  ```

## README

If you are actively using this library, you can find the readme in [OLD-README.md](OLD-README.md).
It is not possible to register for new Stormpath tenants at this time, so you must
already have a Stormpath tenant if you wish to use this library during the migration
period.

[Express-Stormpath Sample Project]: https://github.com/stormpath/express-stormpath-sample-project/
[4.x changelog]: https://github.com/stormpath/express-stormpath/blob/4.0.0/docs/changelog.rst
