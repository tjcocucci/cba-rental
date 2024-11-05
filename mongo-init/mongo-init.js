db = db.getSiblingDB('cba_rent');

if (!db.getCollectionNames().includes('properties')) {
    db.createCollection('properties');
    print('Collection "properties" created');
} else {
    print('Collection "properties" already exists');
}
