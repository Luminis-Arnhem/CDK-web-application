# Serverless web-application using CDK
This project contains a fully functional end solution for a servless web-application using AWS CDK.
If you want to know some more about how I built this, I would like to refer you to my blog. You can find the first part here: https://www.luminis.eu/blog/creating-your-serverless-web-application-using-aws-cdk-part-1/.

This project implement a very simple example of a Todo list application where users can add and list their Todo items. It currently does not offer functionality to check any items off your Todo list.

The application consists of the following:
- A simple Angular based frontend, located in application/frontend
- A set of AWS Lambda functions and a Lambda layer, located in application/functions
- A AWS CDK stack to set up the infrastructure, located in lib/todo_application_stack.ts