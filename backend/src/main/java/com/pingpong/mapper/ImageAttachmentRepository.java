package com.pingpong.mapper;

import com.pingpong.entity.ImageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ImageAttachmentRepository extends JpaRepository<ImageAttachment, Long> {
    List<ImageAttachment> findByEntityTypeAndEntityId(String entityType, Long entityId);
    Optional<ImageAttachment> findTopByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);
}
