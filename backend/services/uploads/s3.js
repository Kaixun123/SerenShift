const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand
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
    if (!file) {
        throw new Error('No file provided');
    } else if (!relatedEntityType || !relatedEntityID) {
        throw new Error('Related entity type and ID must be provided');
    } else if (!user) {
        throw new Error('User must be provided');
    }
    const fileName = file.originalname.split('.').shift();
    const fileExtension = file.originalname.split('.').pop();
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
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${relatedEntityType}/${relatedEntityID}/${fileName}.${fileExtension}`.toLowerCase(),
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await s3.send(command);
        if (foundFile) {
            await foundFile.update({
                s3_key: `${relatedEntityType}/${relatedEntityID}/${fileName}.${fileExtension}`.toLowerCase(),
                last_update_by: user.id,
            });
        } else {
            await File.create({
                file_name: fileName,
                file_extension: fileExtension,
                s3_key: `${relatedEntityType}/${relatedEntityID}/${fileName}.${fileExtension}`.toLowerCase(),
                related_entity: relatedEntityType,
                related_entity_id: relatedEntityID,
                created_by: user.id,
                last_update_by: user.id,
            });
        }
        let updatedFile = await File.findOne({
            where: {
                file_name: fileName,
                file_extension: fileExtension,
                related_entity: relatedEntityType,
                related_entity_id: relatedEntityID,
            },
        });
        return updatedFile;
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
        let presignedUrl = await generatePresignedUrl(file.s3_key);
        results.push({
            file_id: file.file_id,
            file_name: file.file_name,
            file_extension: file.file_extension,
            download_url: presignedUrl,
        });
    }
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
            Bucket: process.env.S3_BUCKET_NAME,
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
                Bucket: process.env.S3_BUCKET_NAME,
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

// Generate a pre-signed URL for downloading/viewing a file
const generatePresignedUrl = async (s3Key, expiresIn = 600) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
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
        Bucket: process.env.S3_BUCKET_NAME,
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
};
