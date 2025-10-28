package com.bucha.dto;

import lombok.Data;
import java.util.List;

@Data
public class CurriculumMetadataDto {
   private Long id;
   private String name;
   private String description;
   private String level;
   private Integer order;

   // Optional list of lesson JSON filenames under this curriculum
   private List<String> lessons;
}