Requirements:

This project has the following minimum requirements
1. Visual Studio 2015 / ASP.NET MVC
2. Typescript 2.2, which can be downloaded here: https://www.microsoft.com/en-us/download/details.aspx?id=48593
3. Node.js, which can be downloaded here: https://nodejs.org/dist/v6.10.2/node-v6.10.2-x64.msi

First time setup:
If the above requirements have been met, you should be able to load the project in either VS2015 or VS2017 and simply press F5.
Note that the first time it runs (and any time after you Clean) the build will take longer, because 'npm install' will be run.

Note about IE11:
IE11 is known to run slowly in debug mode (possibly due to long stack traces). Switch to release for better performance.