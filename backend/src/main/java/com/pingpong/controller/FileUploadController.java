package com.pingpong.controller;

import com.pingpong.entity.ImageAttachment;
import com.pingpong.mapper.ImageAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Autowired
    private ImageAttachmentRepository imageAttachmentRepository;

    private final Path uploadDir = Paths.get("uploads");

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir.toAbsolutePath(), e);
        }
    }

    /**
     * Upload an image file. Returns the URL and metadata.
     */
    @PostMapping("/image")
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "文件为空"));
        }

        // Validate file type
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String lower = originalFilename.toLowerCase();
            if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg")
                    && !lower.endsWith(".png") && !lower.endsWith(".gif")
                    && !lower.endsWith(".webp") && !lower.endsWith(".bmp")) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "仅支持 JPG/PNG/GIF/WEBP/BMP 格式"));
            }
        }

        try {
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            Path targetPath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/api/upload/files/" + filename;

            Map<String, Object> result = new HashMap<>();
            result.put("filename", filename);
            result.put("originalFilename", originalFilename);
            result.put("imageUrl", imageUrl);
            result.put("size", file.getSize());

            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "上传失败: " + e.getMessage()));
        }
    }

    /**
     * Upload multiple images at once.
     */
    @PostMapping("/images")
    public ResponseEntity<List<Map<String, Object>>> uploadMultipleImages(@RequestParam("files") MultipartFile[] files) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            try {
                String extension = "";
                String originalFilename = file.getOriginalFilename();
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String filename = UUID.randomUUID().toString() + extension;
                Path targetPath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                Map<String, Object> item = new HashMap<>();
                item.put("filename", filename);
                item.put("originalFilename", originalFilename);
                item.put("imageUrl", "/api/upload/files/" + filename);
                item.put("size", file.getSize());
                results.add(item);
            } catch (IOException e) {
                Map<String, Object> errorItem = new HashMap<>();
                errorItem.put("error", e.getMessage());
                errorItem.put("originalFilename", file.getOriginalFilename());
                results.add(errorItem);
            }
        }
        return ResponseEntity.ok(results);
    }

    /**
     * Serve uploaded files.
     */
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = uploadDir.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Bind an uploaded image to an entity (player or competition).
     */
    @PostMapping("/bind")
    public ResponseEntity<?> bindImage(@RequestBody Map<String, Object> request) {
        String entityType = (String) request.get("entityType");
        if (entityType == null || (!entityType.equals("PLAYER") && !entityType.equals("COMPETITION"))) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "entityType 必须为 PLAYER 或 COMPETITION"));
        }

        Object entityIdObj = request.get("entityId");
        if (entityIdObj == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "entityId 不能为空"));
        }
        Long entityId = Long.valueOf(entityIdObj.toString());

        String imageUrl = (String) request.get("imageUrl");
        if (imageUrl == null || imageUrl.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "imageUrl 不能为空"));
        }

        ImageAttachment attachment = new ImageAttachment();
        attachment.setEntityType(entityType);
        attachment.setEntityId(entityId);
        attachment.setImageUrl(imageUrl);
        attachment.setOriginalFilename((String) request.get("originalFilename"));

        if (request.get("fileSize") != null) {
            attachment.setFileSize(Long.valueOf(request.get("fileSize").toString()));
        }

        ImageAttachment saved = imageAttachmentRepository.save(attachment);
        return ResponseEntity.ok(saved);
    }

    /**
     * Get all images for an entity.
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<ImageAttachment>> getEntityImages(
            @PathVariable String entityType, @PathVariable Long entityId) {
        List<ImageAttachment> images = imageAttachmentRepository
                .findByEntityTypeAndEntityId(entityType, entityId);
        return ResponseEntity.ok(images);
    }

    /**
     * Get the latest image for an entity.
     */
    @GetMapping("/entity/{entityType}/{entityId}/latest")
    public ResponseEntity<?> getLatestEntityImage(
            @PathVariable String entityType, @PathVariable Long entityId) {
        Optional<ImageAttachment> image = imageAttachmentRepository
                .findTopByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        if (image.isPresent()) {
            return ResponseEntity.ok(image.get());
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Delete all images for an entity.
     */
    @DeleteMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Void> deleteEntityImages(
            @PathVariable String entityType, @PathVariable Long entityId) {
        imageAttachmentRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
        return ResponseEntity.ok().build();
    }
}
