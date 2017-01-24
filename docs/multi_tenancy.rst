.. _multi_tenancy:


Multi Tenancy
=============

Stormpath makes it easy for you to create multi-tenant applications.  The
express-stormpath library allows you to easily enable a subdomain-based
solution for multi-tenancy, using the Organization features of Stormpath.



Enabling Subdomain-based Multi-Tenancy
--------------------------------------

To enable this feature, the following configuration is required when you initialize
this library:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    web: {
      domainName: 'example.com',
      multiTenancy: {
        enabled: true,
        strategy: 'subdomain'
      }
    }
  }));

If you are developing locally, you will need to modify your ``/etc/hosts`` file
to point your organization-specific subdomains at your local computer.  For
the example that follows, you would put the following in the hosts file:

.. code-block:: yaml

  127.0.0.1 usd.example.com
  127.0.0.1 midtown-events.example.com

Example Subdomain Scenario
--------------------------

To understand how this feature works, assume you have the following resources
setup in Stormpath:

- An application named "Printing Services LLC"
- Two organizations, with the following names and ``nameKey`` properties, that are mapped to the "Printing Services LLC" application:

  +---------------------------+--------------------+
  | Organization Name         | ``nameKey``        |
  +===========================+====================+
  | "Unified School District" | ``usd``            |
  +---------------------------+--------------------+
  | "Midtown Event Catering"  | ``midtown-events`` |
  +---------------------------+--------------------+

With this setup, your Express application will exhibit the following behavior:

* The name keys will map on to subdomains of your application, so when a user visits https://midtown-events.example.com/login, their login attempt will happen within "Midtown Event Catering" organization.  After the user authenticates, the  organization context is persisted in their access token.

* If the user visits the parent domain, https://example.com/login, they will be required to supply their organization name key, and will be redirected to the correct subdomain.

* If the user visits an unknown subdomain that does not map onto an organization, they will be redirected to https://example.com/login, where they will be required to supply their organization name key.


Authenticated Organization Context
----------------------------------

When a user authenticates through an organization, their access token will indicate which organization they logged into.  You can pull this information from the authentication result, which is attached to the ``req.authenticationResult.expandedJwt.claims.org`` property, which is the href of the organization that the user has authenticated against.

Here is an example of using the authentication result to determine which organization a user has authenticated against:

.. code-block:: javascript

  app.get('/dashboard', stormpath.loginRequired, function (req, res) {

    var client = req.app.get('stormpathClient');
    var orgHref = req.authenticationResult.expandedJwt.claims.org;

    if (!orgHref) {
      return res.json(403, 'You are not logged in to an organization.');
    }

    client.getOrganization(orgHref, function (err, organization) {
      if (err) {
        return res.json(err.status, err.message);
      }

      res.json({
        message: 'You are logged into the "' + organization.name + '" organization.'
      });
    });
  });


