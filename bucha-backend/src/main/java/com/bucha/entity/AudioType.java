package com.bucha.entity;

public enum AudioType {
   LOCAL_FILE, // File trong thư mục uploads
   EXTERNAL_URL, // URL từ nguồn bên ngoài
   CLOUDINARY_URL, // Full Cloudinary URL
   CLOUDINARY_AUTO // Build from public_id/path
}