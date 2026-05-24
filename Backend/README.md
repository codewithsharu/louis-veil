# Backend Documentation

## Environment Configuration

The backend environment requires a connection to MongoDB Atlas and Cloudinary for media storage. Note that the `.env` file should be kept private and never committed to version control.

### MongoDB Configuration
The MongoDB Atlas string has been updated to point to the newly created `louisveil` database:
`MONGO_URI="mongodb+srv://louisveilcom_db_user:<password>@cluster0.psenw1k.mongodb.net/louisveil?retryWrites=true&w=majority&appName=Cluster0"`
*(Remember to format special characters like `#` as `%23` if present in the password)*

### Cloudinary Configuration
Cloudinary is used for storing uploaded media assets (like products). It expects the following values in your hosting dashboard:
- `CLOUDINARY_CLOUD_NAME=dcsdmkvrq`
- `CLOUDINARY_API_KEY=139924467126643`
- `CLOUDINARY_API_SECRET=rXrYKotvIz1zBFWJ0mJFqxeeIzg`

***
**Deployment triggers**: Pushing updates to markdown or code inside this directory will automatically trigger related downstream GitHub Actions or deployment webhooks for the Backend service.
