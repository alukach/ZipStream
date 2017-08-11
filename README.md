# ZipStream Service

A backend-swappable service to build and stream zipped bundles of remote files. The service never actually stores files, rather it stores references to files which it can stream in a zipped package to users.


## Supported Backends

The system relies on two backend types: Database and Filestore.

### Database backend

The database backend is responsible for managing data that represent ZipStream [`Bundle`] instances.

To add support for a new database backend, a file should be placed in the `backends/db` directory and offer four functions: `create`, `read`, `update`, `delete`. Each function must take in a [`FileRef`] object and return a Promise object.

#### Currently supported database backends:

- Amazon DynamoDB

To see what's on the database backends radar, see our [Issues](https://github.com/Cadasta/ZipStream-Service/issues?q=is%3Aopen+label%3Aenhancement+label%database).

### Filestore backend

The filestore backend is responsible for returning files in a [Readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) format.

To add support for a new filestore backend, a file should be placed in the `backends/fs` directory and offer a single function: `getStream`. This functino should take in a `base` and `path` argument and return a readable stream.

#### Currently supported filestore backends:

- Amazon S3

To see what's on the filestore backends radar, see our [Issues](https://github.com/Cadasta/ZipStream-Service/issues?q=is%3Aopen+label%3Aenhancement+label%3Afilestore).


## Models

### `FileRef`

- `base`: `String`, base directory or base location of file (depending on backend), such as S3 Bucket
- `path`: `String`, path to file, relative to base value
- `dest`: `String`, _optional_, desired path of file when in bundle, defaults to `path` value

### `Bundle`

- `id`: `String`, UUIDv4
- `secret`: `String`, UUIDv4
- `files`: `Array`, [`FileRef`] objects
- `expirationDate`: `Number`, unix timestamp representing date at which record should be deleted. Note that the codebase does not manage the removal of expired bundles. It is up to individual backends to set up expiration logic via TTL or database trigger settings
- `filename`: `String`, desired filename of bundle (should end with .zip)


## Usage

### Create Bundle

Creates a bundle.

**URL** : `/`

**Method** : `POST`

**Data constraints**

```json
{
    "filename": "[desired filename of bundle (should end with .zip)]"
}
```

Or, optionally:

```json
{
    "filename": "[desired filename of bundle]",
    "files": [
        {
            "base": "[base directory or base location of file (depending on backend), such as S3 Bucket]",
            "path": "[path to file, relative to base value]",
            "dest": "[optional, desired path of file when in bundle, defaults to 'path' value ]"
        }
    ]
}
```

**Data example**

```json
{
    "filename": "`",
    "files": [
        {
            "base": "my-aws-bucket-1",
            "path": "path/to/foo.jpg",
            "dest": "foo.jpg"
        },
        {
            "base": "some-other-bucket-2",
            "path": "bar.gif"
        }
    ]
}
```

#### Success Response

JSON representation of created bundle.

**Code** : `201 CREATED`

**Content example**

```json
{
   "expirationDate" : 1503029550,
   "secret" : "bd1be533-3c5c-4395-bda9-73dd288c5487",
   "filename" : "my-awesome-bundle.zip",
    "files": [
        {
            "base": "my-aws-bucket-1",
            "path": "path/to/foo.jpg",
            "dest": "foo.jpg"
        },
        {
            "base": "some-other-bucket-2",
            "path": "bar.gif"
        }
   ],
   "id" : "c4f6f218-afc4-4af1-ae1b-b22e9b058f26"
}
```

### Download Bundle

Download a bundle.

**URL** : `/:id/`

**Method** : `GET`

#### Success Response

Streaming download of zipped bundle.

**Code** : `200 OK`

_Download of `my-awesome-bundle.zip` containing `foo.jpg` and `bar.gif`._

### Get Bundle Information

Retrieves bundle information.

**URL** : `/:id/:secret/`

**Method** : `GET`

#### Success Response

JSON representation of retrieved bundle.

**Code** : `200 OK`

**Content example**

```json
{
   "expirationDate" : 1503029550,
   "secret" : "bd1be533-3c5c-4395-bda9-73dd288c5487",
   "filename" : "my-awesome-bundle.zip",
    "files": [
        {
            "base": "my-aws-bucket-1",
            "path": "path/to/foo.jpg",
            "dest": "foo.jpg"
        },
        {
            "base": "some-other-bucket-2",
            "path": "bar.gif"
        }
   ],
   "id" : "c4f6f218-afc4-4af1-ae1b-b22e9b058f26"
}
```

### Update Bundle

Append files a bundle.

**URL** : `/:id/:secret/`

**Method** : `PUT`

**Data constraints**

```json
{
    "files": [
        {
            "base": "[base directory or base location of file (depending on backend), such as S3 Bucket]",
            "path": "[path to file, relative to base value]",
            "dest": "[optional, desired path of file when in bundle, defaults to 'path' value ]"
        }
    ]
}
```

**Data example**

```json
{
    "filename": "`",
    "files": [
        {
            "base": "one-more-bucket-3",
            "path": "another/file.pdf",
            "dest": "another-one.pdf"
        }
    ]
}
```

#### Success Response

JSON representation of bundle with newly-appended data.

**Code** : `200 OK`

**Content example**

```json
{
   "expirationDate" : 1503029550,
   "secret" : "bd1be533-3c5c-4395-bda9-73dd288c5487",
   "filename" : "my-awesome-bundle.zip",
    "files": [
        {
            "base": "my-aws-bucket-1",
            "path": "path/to/foo.jpg",
            "dest": "foo.jpg"
        },
        {
            "base": "some-other-bucket-2",
            "path": "bar.gif"
        },
        {
            "base": "one-more-bucket-3",
            "path": "another/file.pdf",
            "dest": "another-one.pdf"
        }
   ],
   "id" : "c4f6f218-afc4-4af1-ae1b-b22e9b058f26"
}
```

### Delete Bundle

Used to create an empty bundle.

**URL** : `/:id/:secret/`

**Method** : `DELETE`

#### Success Response

JSON representation of deleted bundle.

**Code** : `200 OK`

**Content example**

```json
{
   "expirationDate" : 1503029550,
   "secret" : "bd1be533-3c5c-4395-bda9-73dd288c5487",
   "filename" : "my-awesome-bundle.zip",
    "files": [
        {
            "base": "my-aws-bucket-1",
            "path": "path/to/foo.jpg",
            "dest": "foo.jpg"
        },
        {
            "base": "some-other-bucket-2",
            "path": "bar.gif",
        },
        {
            "base": "one-more-bucket-3",
            "path": "another/file.pdf",
            "dest": "another-one.pdf"
        }
   ],
   "id" : "c4f6f218-afc4-4af1-ae1b-b22e9b058f26"
}
```

[`FileRef`]: #fileref
[`Bundle`]: #bundle
