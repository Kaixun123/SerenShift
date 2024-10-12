'use client';

import { useEffect, useState } from 'react';
import {useDropzone} from 'react-dropzone';
import Image from 'next/image';
import styles from './Styling/FileUpload.module.css'
import { useToast } from '@chakra-ui/react';

const FileUploader = ({ onFilesChange, clearFiles }) => {
    const [files, setFiles] = useState([]);
    const toast = useToast();
    const maxFileLength = 50;
    const maxSize = 2.2 * 1024 * 1024; // 2.2 MB in bytes

    function nameLengthValidator(file) {
      if (file.name.length > maxFileLength) {
        toast({
          title: "File Name Too Long",
          description: `The file name is larger than ${maxFileLength} characters.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return {
            code: "name-too-large",
            message: `Name is larger than ${maxFileLength} characters`
        };
      }   
      return null
    }
    const {
      getRootProps, 
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject
    } = useDropzone({
      accept: {
        'image/*': [], // All image types
        'application/pdf': [], // PDF files
        'application/msword': [], // .doc files
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [], // .docx files
      },
      maxFiles: 5,
      multiple: true,
      maxSize: maxSize,
      validator: nameLengthValidator,
      onDrop: (acceptedFiles, fileRejections) => {
        // Merge the new files with the existing files
        const updatedFiles = [
            ...files, // Spread the existing files
            ...acceptedFiles.map(file => Object.assign(file, {
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            }))
        ];

        setFiles(updatedFiles);

        // Call the callback to pass files to the parent component
        if (typeof onFilesChange === 'function') {
            onFilesChange(updatedFiles);
        }

        // Handle file rejections
        fileRejections.forEach(({ file, errors }) => {
            errors.forEach((error) => {
                if (error.code === 'file-too-large') {
                    toast({
                        title: "File Too Large",
                        description: `The file ${file.name} exceeds the size limit of ${(maxSize / (1024 * 1024)).toFixed(1)} MB.`,
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            });
        });
      },
    });

    const dropzoneClass = `
      ${styles.baseStyle} 
      ${isDragActive ? styles.activeStyle : ''} 
      ${isDragAccept ? styles.acceptStyle : ''} 
      ${isDragReject ? styles.rejectStyle : ''}
    `;

  // Function to remove a file from the list
  const removeFile = (fileName) => {
    const updatedFiles = files.filter(file => file.name !== fileName);
    setFiles(updatedFiles);
    if (onFilesChange) {
      onFilesChange(updatedFiles); // Pass the updated files to the parent component if the callback is provided
    }
  };

    const thumbs = files.map(file => (
      <div className={styles.thumb} key={file.name}>
        <div className={styles.thumbInner}>
        {file.preview ? (
          // Image preview for image files
          <Image
            src={file.preview}
            className={styles.img}
            alt='file-uploaded'
            width={150}
            height={150}
            onLoad={() => { URL.revokeObjectURL(file.preview); }}
          />
        ) : (
          // Folder icon for non-image files
          <div className={styles.folderPreview}>
            <Image
              src="/docs.png" // Path to your folder icon
              alt="Folder icon"
              width={50}
              height={50}
            />
            <p className={styles.fileName}>
              {file.name}
            </p>
          </div>
        )}
        </div>
        <button className={styles.removeButton} onClick={() => removeFile(file.name)}>
          &times; {/* This renders the X symbol */}
        </button>
      </div>
    ));  

    useEffect(() => {
      if (clearFiles) {
        files.forEach(file => URL.revokeObjectURL(file.preview)); // Revoke previews to prevent memory leaks
        setFiles([]); // Clear file state
      }
    }, [clearFiles]);
  
    return (
      <section className="container">
        <div {...getRootProps({ className: dropzoneClass.trim() })}>
          <input {...getInputProps()} />
          <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
        </div>
        <aside className={styles.thumbsContainer}>
          {thumbs}
        </aside>
      </section>
    );
};

export default FileUploader