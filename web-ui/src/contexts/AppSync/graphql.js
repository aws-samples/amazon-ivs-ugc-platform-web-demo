export const subscribeDoc = `
    subscription Subscribe($name: String!) {
        subscribe(name: $name) {
            data
            name
        }
    }
`;

export const publishDoc = `
    mutation Publish($data: AWSJSON!, $name: String!) {
        publish(data: $data, name: $name) {
            data
            name
        }
    }
`;
