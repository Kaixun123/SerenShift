const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    CopyObjectCommand
} = require('@aws-sdk/client-s3');
const { File } = require('../../models');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION
});

// Upload a file to S3
const uploadFile = async (file, relatedEntityType, relatedEntityID, overwrite = false, user) => {

    console.log(relatedEntityID);
    console.log(user);
    
    if (!file) {
        throw new Error('No file provided');
    } else if (!relatedEntityType || !relatedEntityID) {
        throw new Error('Related entity type and ID must be provided');
    } else if (!user) {
        throw new Error('User must be provided');
    }

    // Log the file object for debugging
    console.log('File object:', file);

    // Validate the file object
    if (!file.originalname || !file.buffer || !file.mimetype) {
        throw new Error('Invalid file object. The file must have originalname, buffer, and mimetype properties.');
    }


    const fileName = file.originalname.split('.').shift();
    const fileExtension = file.originalname.split('.').pop();

    //rename the file before sending to s3 bucket
    const userId = user.id;
    const currentDateTime = new Date().toISOString().replace(/[:.-]/g, '');

    const newFileName = `${fileName}_${userId}_${relatedEntityID}_${currentDateTime}`;

    let foundFile = await File.findOne({
        where: {
            file_name: fileName,
            file_extension: fileExtension,
            related_entity: relatedEntityType,
            related_entity_id: relatedEntityID,
        },
    });
    if (foundFile && !overwrite) {
        throw new Error('The uploaded file already exists on S3 but you do not want to overwrite it');
    }
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
            Key: `${process.env.NODE_ENV}/${relatedEntityType}/${relatedEntityID}/${newFileName}.${fileExtension}`.toLowerCase(),
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await s3.send(command);
        if (foundFile) {
            await foundFile.update({
                s3_key: `${process.env.NODE_ENV}/${relatedEntityType}/${relatedEntityID}/${newFileName}.${fileExtension}`.toLowerCase(),
                last_update_by: user.id,
            });
        } else {
            await File.create({
                file_name: newFileName,
                file_extension: fileExtension,
                s3_key: `${process.env.NODE_ENV}/${relatedEntityType}/${relatedEntityID}/${newFileName}.${fileExtension}`.toLowerCase(),
                related_entity: relatedEntityType,
                related_entity_id: relatedEntityID,
                created_by: user.id,
                last_update_by: user.id,
            });
        }

        return foundFile || await File.findOne({
            where: {
                file_name: newFileName,
                file_extension: fileExtension,
                related_entity: relatedEntityType,
                related_entity_id: relatedEntityID,
            },
        });

    } catch (error) {
        throw new Error(`Error uploading file to S3: ${error}`);
    }
};

const retrieveFileDetails = async (relatedEntityType, relatedEntityID) => {
    if (!relatedEntityType || !relatedEntityID) {
        throw new Error('Related entity type and ID must be provided');
    }
    let foundFiles = await File.findAll({
        where: {
            related_entity: relatedEntityType,
            related_entity_id: relatedEntityID,
        },
    });
    let results = [];
    for (let file of foundFiles) {
        if (checkFileExists(file.s3_key)) {
            let presignedUrl = await generatePresignedUrl(file.s3_key);
            results.push({
                file_id: file.file_id,
                file_name: file.file_name,
                file_extension: file.file_extension,
                download_url: presignedUrl,
                created_by: file.created_by,
                s3_key: file.s3_key,
            });
        } else {
            await file.destroy();
        }
    }
    console.log(results)
    return results;
};

// Delete a file from S3
const deleteFile = async (fileID) => {
    if (!fileID) {
        throw new Error('No file ID provided');
    }
    let foundFile = await File.findByPk(fileID);
    if (!foundFile) {
        throw new Error('File not found');
    }
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
            Key: foundFile.s3_key,
        });
        await s3.send(command);
        await foundFile.destroy();
        return true;
    } catch (error) {
        throw new Error(`Error deleting file from S3: ${error}`);
    }
};

const deleteAllFiles = async (relatedEntityType, relatedEntityID) => {
    if (!relatedEntityType || !relatedEntityID) {
        throw new Error('Related entity type and ID must be provided');
    }
    let foundFiles = await File.findAll({
        where: {
            related_entity: relatedEntityType,
            related_entity_id: relatedEntityID,
        },
    });
    if (!foundFiles) {
        throw new Error('No files found');
    }
    try {
        for (let file of foundFiles) {
            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
                Key: file.s3_key,
            });
            await s3.send(command);
            await file.destroy();
        }
        return true;
    } catch (error) {
        throw new Error(`Error deleting files from S3: ${error}`);
    }
};

//update the file name of there is a withdraw in specific application day
const copyFileInS3 = async (oldKey, newKey) => {
    const copyParams = {
        Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
        CopySource: `${process.env.AWS_S3_UPLOADS_BUCKET}/${oldKey}`,
        Key: newKey,
    };

    console.log("copy params", copyParams);

    try{
        const fileExists = await checkFileExists(oldKey);
        if (fileExists) {
            await s3.send(new CopyObjectCommand(copyParams));
            console.log(`File copied successfully from ${oldKey} to ${newKey}`);
        } else {
            console.log(`File not found at ${oldKey}, retrieving and uploading new file to ${newKey}`);
            const fileData = await getFileFromS3(oldKey);
            const uploadParams = {
                Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
                Key: newKey,
                Body: fileData.buffer,
                ContentType: fileData.mimetype,
            };
            await s3.send(new PutObjectCommand(uploadParams));
            console.log(`New file uploaded successfully to ${newKey}`);
        }
    } catch (error) {
        console.error("Error copying file in S3:", error);
        throw error;
    }
}

//helper function to get file information
const getFileFromS3 = async (s3Key) => {
    const params = {
        Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
        Key: s3Key,
    };

    try {
        const data = await s3.send(new GetObjectCommand(params));
        const buffer = await streamToBuffer(data.Body);
        return {
            buffer,
            mimetype: data.ContentType,
        };
    } catch (error) {
        console.error("Error retrieving file from S3:", error);
        throw error;
    }
};

// Helper function to convert stream to buffer
const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

// Generate a pre-signed URL for downloading/viewing a file
const generatePresignedUrl = async (s3Key, expiresIn = 600) => {
    const params = {
        Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
        Key: s3Key,
    };

    const command = new GetObjectCommand(params);

    // Generate the signed URL for the file
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn });
    return presignedUrl;
};

// Check if a file exists in S3 by fetching its metadata
const checkFileExists = async (s3Key) => {
    const params = {
        Bucket: process.env.AWS_S3_UPLOADS_BUCKET,
        Key: s3Key,
    };

    try {
        await s3.send(new HeadObjectCommand(params));
        return true; // File exists
    } catch (error) {
        if (error.name === 'NotFound') {
            return false; // File doesn't exist
        }
        throw error; // Something else went wrong
    }
};

module.exports = {
    uploadFile,
    retrieveFileDetails,
    deleteFile,
    deleteAllFiles,
    copyFileInS3,
    checkFileExists,
};
