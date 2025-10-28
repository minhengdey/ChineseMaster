package com.bucha.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwsHeader; // <-- THAY ĐỔI Ở ĐÂY

/**
 * Lớp tùy chỉnh để bọc header, claims và signature của một token đã hết hạn.
 */
public class ExpiredJws implements Jws<Claims> {

   private final JwsHeader header; // <-- THAY ĐỔI Ở ĐÂY
   private final Claims body;
   private final String signature;

   public ExpiredJws(JwsHeader header, Claims body, String signature) { // <-- THAY ĐỔI Ở ĐÂY
      this.header = header;
      this.body = body;
      this.signature = signature;
   }

   @Override
   public JwsHeader getHeader() { // <-- THAY ĐỔI Ở ĐÂY
      return this.header;
   }

   @Override
   public Claims getBody() {
      return this.body;
   }

   @Override
   public String getSignature() {
      return this.signature;
   }
}