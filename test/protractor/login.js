/*
  Very simple test!  It assumes you're running an app
  which is built like our sample app in the guide, and not using
  an alternate defaultPostLoginState.
 */
describe('Demo Login Form', function() {
  it('should exist on the /login route page', function() {
    browser.get('http://localhost:9000/login');
    expect(element(by.css('[sp-login-form]')).isPresent()).toBe(true);
  });

  it('should send me to the homepage when i login', function() {
    browser.get('http://localhost:9000/login');

    element(by.id('spUsername')).sendKeys('robert@stormpath.com');
    element(by.id('spPassword')).sendKeys('robert@stormpath.comA1');
    element(by.css('form')).submit();
    expect(browser.getCurrentUrl()).toBe('http://localhost:9000/');
  });

  it('should redirect me to the homepage if i go back to the login page', function() {
    browser.navigate().back();
    expect(browser.getCurrentUrl()).toBe('http://localhost:9000/');
  });

  it('should redirect me to the homepage if navigate to /login while logged in', function() {
    browser.get('http://localhost:9000/login');
    expect(browser.getCurrentUrl()).toBe('http://localhost:9000/');
  });
});