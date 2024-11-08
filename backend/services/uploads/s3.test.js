const {
    uploadFile,
    retrieveFileDetails,
    deleteFile,
    deleteAllFiles,
    generatePresignedUrl,
    checkFileExists
} = require('./s3');
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { File } = require('../../models');

// Mock the File model
jest.mock('../../models', () => ({
    File: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn(),
        update: jest.fn(),
    },
}));

// Mock the Date class
const mockDate = '2024-01-01T00:00:00.000Z';
jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue(mockDate);

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    HeadObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn(),
}));

describe('S3 Helper', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('should upload a file to S3 and create a new file record', async () => {
            const file = { originalname: 'test.txt', buffer: Buffer.from('Test'), mimetype: 'text/plain' };
            const user = { id: 1 };
            const relatedEntityType = 'application';
            const relatedEntityID = 123;

            File.findOne.mockResolvedValue(null); // No file found, new file
            const commandMock = jest.fn();
            S3Client.prototype.send = commandMock.mockResolvedValue(true);

            const result = await uploadFile(file, relatedEntityType, relatedEntityID, false, user);

            expect(File.findOne).toHaveBeenCalled();
            expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
            expect(File.create).toHaveBeenCalledWith(expect.objectContaining({
                file_name: file.originalname + '_' + user.id + '_' + relatedEntityID + '_20220101000000000',
                file_extension: 'txt',
                related_entity: relatedEntityType,
                related_entity_id: relatedEntityID,
                created_by: user.id,
                last_update_by: user.id
            }));
        });

        it('should throw an error if no file is provided', async () => {
            await expect(uploadFile(null, 'application', 123, false, { id: 1 }))
                .rejects.toThrow('No file provided');
        });

        it('should throw an error if file already exists and overwrite is false', async () => {
            const file = { originalname: 'test.txt', buffer: Buffer.from('Test'), mimetype: 'text/plain' };
            const user = { id: 1 };

            File.findOne.mockResolvedValue({ file_name: 'test', file_extension: 'txt' }); // File exists

            await expect(uploadFile(file, 'application', 123, false, user))
                .rejects.toThrow('The uploaded file already exists on S3 but you do not want to overwrite it');
        });
    });

    describe('retrieveFileDetails', () => {
        it('should retrieve file details with presigned URLs', async () => {
            const files = [{ file_id: 1, file_name: 'test', file_extension: 'txt', s3_key: 'key' }];
            File.findAll.mockResolvedValue(files);
            checkFileExists.mockResolvedValue(true);
            getSignedUrl.mockResolvedValue('https://signedurl.com');

            const result = await retrieveFileDetails('application', 123);

            expect(File.findAll).toHaveBeenCalled();
            expect(checkFileExists).toHaveBeenCalledWith('key');
            expect(getSignedUrl).toHaveBeenCalled();
            expect(result).toEqual([{
                file_id: 1,
                file_name: 'test',
                file_extension: 'txt',
                download_url: 'https://signedurl.com'
            }]);
        });

        it('should delete file if it does not exist in S3', async () => {
            const files = [{ file_id: 1, file_name: 'test', file_extension: 'txt', s3_key: 'key' }];
            File.findAll.mockResolvedValue(files);
            checkFileExists.mockResolvedValue(false);

            const result = await retrieveFileDetails('application', 123);

            expect(File.findAll).toHaveBeenCalled();
            expect(checkFileExists).toHaveBeenCalledWith('key');
            expect(File.prototype.destroy).toHaveBeenCalled(); // File should be deleted from the database
            expect(result).toEqual([]);
        });
    });

    describe('deleteFile', () => {
        it('should delete a file from S3 and the database', async () => {
            const file = { s3_key: 'key', destroy: jest.fn() };
            File.findByPk.mockResolvedValue(file);
            S3Client.prototype.send = jest.fn().mockResolvedValue(true);

            const result = await deleteFile(1);

            expect(File.findByPk).toHaveBeenCalledWith(1);
            expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
            expect(file.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should throw an error if the file is not found', async () => {
            File.findByPk.mockResolvedValue(null);

            await expect(deleteFile(1)).rejects.toThrow('File not found');
        });
    });

    describe('deleteAllFiles', () => {
        it('should delete all files related to an entity from S3 and the database', async () => {
            const files = [{ s3_key: 'key', destroy: jest.fn() }];
            File.findAll.mockResolvedValue(files);
            S3Client.prototype.send = jest.fn().mockResolvedValue(true);

            const result = await deleteAllFiles('application', 123);

            expect(File.findAll).toHaveBeenCalledWith({ where: { related_entity: 'application', related_entity_id: 123 } });
            expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
            expect(files[0].destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    describe('generatePresignedUrl', () => {
        it('should generate a presigned URL for downloading a file', async () => {
            getSignedUrl.mockResolvedValue('https://signedurl.com');

            const result = await generatePresignedUrl('key');

            expect(getSignedUrl).toHaveBeenCalledWith(expect.any(S3Client), expect.any(GetObjectCommand), { expiresIn: 600 });
            expect(result).toBe('https://signedurl.com');
        });
    });

    describe('checkFileExists', () => {
        it('should return true if the file exists in S3', async () => {
            S3Client.prototype.send = jest.fn().mockResolvedValue(true);

            const result = await checkFileExists('key');

            expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
            expect(result).toBe(true);
        });

        it('should return false if the file does not exist in S3', async () => {
            const error = new Error();
            error.name = 'NotFound';
            S3Client.prototype.send = jest.fn().mockRejectedValue(error);

            const result = await checkFileExists('key');

            expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
            expect(result).toBe(false);
        });
    });
});
