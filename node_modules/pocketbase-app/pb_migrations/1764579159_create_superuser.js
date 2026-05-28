/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)

    record.set("email", "suji.industrieshq@leadcrm.com")
    record.set("password", "industrieshub69")

    app.save(record)
})