Facebook Profile Picture Example
--------------------------------

This example demonstrates how to retrieve the Facebook profile
picture when logging in with the Facebook OAuth provider.

## Before you begin

1. Create a Stormpath Account and set your environment variables. To learn more, [follow the 'Setup' steps in our docs.](https://docs.stormpath.com/nodejs/express/latest/setup.html)
2. Set up Facebook Social Auth with Stormpath. To learn more, [see our 'Facebook Login' docs.](https://docs.stormpath.com/nodejs/express/latest/social_login.html#facebook-login)

## Install

Simply install all dependencies by executing `$ npm install`.

## Usage

1. Start the application by running `$ node app.js`.
2. Open up your browser and navigate to [http://localhost:3000/login](http://localhost:3000/login).
3. Click the Facebook-button to login with your Facebook credentials.
4. You should now see the text `Facebook profile picture of account '(Stormpath account href)' is '(Facebook profile picture URL)'.` in your console.

## Next steps

Now that you have the account's href and a profile picture URL, you can [save it to custom data](https://docs.stormpath.com/nodejs/express/latest/user_data.html), embed the image on one of your pages, etc.  
