
import { TodoItem } from '/opt/nodejs/todoItem';

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const todoItemsTable: string = process.env.TODO_ITEMS_TABLE_NAME as string;
const allowedOrigins: string = process.env.ALLOWED_ORIGINS as string;

export async function handler(event: any, context: any): Promise<any> {
    if (event.requestContext?.authorizer?.claims?.email) {
        return dynamodb.query({
            TableName : todoItemsTable,
            KeyConditionExpression: "#who = :who",
            ExpressionAttributeNames:{
                "#who": "who"
            },
            ExpressionAttributeValues: {
                ":who": event.requestContext.authorizer.claims.email
            }
        }).promise()
        .then((items: TodoItem[]) => {
            return createJSONResponse(200, allowedOrigins, items)
        })
        .catch((err: any) => {
            console.error(err);
            return createJSONResponse(500, allowedOrigins, err.message)
        });
    } else {
        return createJSONResponse(400, allowedOrigins, 'No principal found')
    }
}

export const createJSONResponse = (statusCode: number, allowedOrigin: string, body: any): {} => {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin
        },
        body: JSON.stringify(body)
    }
}