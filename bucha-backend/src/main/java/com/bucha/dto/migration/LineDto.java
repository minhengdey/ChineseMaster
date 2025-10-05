package com.bucha.dto.migration;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LineDto {
   private String speaker;

   @JsonProperty("zh")
   private String zh;

   private String pinyin;

   @JsonProperty("vn")
   private String vn;
}
