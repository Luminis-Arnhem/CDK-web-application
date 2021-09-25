import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as TodoApplication from '../lib/todo_application-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TodoApplication.TodoApplicationStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
