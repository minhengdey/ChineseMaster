# =========================================================================================
# HƯỚNG DẪN CẤU TRÚC THƯ MỤC VÀ TỆP ÂM THANH
#
# Để script này hoạt động chính xác, hãy sắp xếp các thư mục và tệp MP3 theo cấu trúc sau.
# Script sẽ tự động quét thư mục `process` để tìm và xử lý các tệp âm thanh.
#
# --- SƠ ĐỒ CẤU TRÚC ---
# /thư_mục_chứa_script/
# │
# ├── process/                  <-- THƯ MỤC NGUỒN CHÍNH
# │   │
# │   ├── 1_tu_vung_1.mp3       <-- Các file âm thanh của TỪ VỰNG
# │   ├── 2_tu_vung_2.mp3
# │   ├── ...
# │   │
# │   ├── vocab_example/        <-- Thư mục con cho VÍ DỤ của từ vựng
# │   │   ├── 1_vi_du_1.mp3
# │   │   ├── 2_vi_du_2.mp3
# │   │   └── ...
# │   │
# │   ├── conversation_1/       <-- Thư mục cho HỘI THOẠI 1
# │   │   ├── 1_line_1.mp3
# │   │   ├── 2_line_2.mp3
# │   │   └── ...
# │   │
# │   └── conversation_2/       <-- Thư mục cho HỘI THOẠI 2
# │       ├── 1_line_1.mp3
# │       └── ...
# │
# ├── your_script.py            <-- File script Python này
# │
# ├── test/                     <-- Thư mục ĐÍCH (sẽ được tự động tạo nếu chưa có)
# │
# └── rename_log.txt            <-- File LOG (sẽ được tự động tạo)
#
# --- QUY TẮC QUAN TRỌNG ---
#
# 1. THƯ MỤC NGUỒN:
#    - Tất cả các tệp MP3 cần xử lý phải được đặt bên trong thư mục `process`.
#
# 2. QUY TẮC ĐẶT TÊN TỆP:
#    - MỌI tệp MP3 phải có tên bắt đầu bằng một con số và dấu gạch dưới `_`.
#    - Định dạng: `<số thứ tự>_tên_bất_kỳ.mp3`
#    - Ví dụ ĐÚNG: `1_nihao.mp3`, `2_xiexie.mp3`, `10_zaijian.mp3`
#    - Ví dụ SAI: `nihao.mp3`, `file-1.mp3`
#    - LÝ DO: Con số ở đầu giúp script sắp xếp các tệp theo đúng thứ tự trước khi đổi tên.
#      Nếu không có con số này, tệp sẽ bị bỏ qua.
#
# 3. PHÂN LOẠI ÂM THANH:
#    - Âm thanh TỪ VỰNG: Đặt trực tiếp trong `process`.
#    - Âm thanh VÍ DỤ TỪ VỰNG: Đặt trong thư mục con `process/vocab_example`.
#    - Âm thanh HỘI THOẠI: Đặt trong các thư mục con `process/conversation_<số>`.
#      Ví dụ: `process/conversation_1`, `process/conversation_2`, ...
#
# =========================================================================================


import os
import re
import shutil
from datetime import datetime

def process_and_copy_mp3s(source_dir, dest_dir, rename_callback, log_list):
    """
    Quét, đổi tên, SAO CHÉP tệp MP3 và ghi lại vào danh sách log.
    """
    # --- 1. Kiểm tra thư mục nguồn ---
    if not os.path.isdir(source_dir):
        print(f"❌ Lỗi: Không tìm thấy thư mục nguồn '{source_dir}'. Vui lòng kiểm tra lại.")
        return

    # --- 2. Tạo thư mục đích nếu nó chưa tồn tại ---
    os.makedirs(dest_dir, exist_ok=True)
    print(f"🔍 Quét thư mục: '{os.path.abspath(source_dir)}'")
    print(f"📂 Thư mục đích: '{os.path.abspath(dest_dir)}'\n")

    # --- 3. Lọc và sắp xếp các tệp cần xử lý ---
    try:
        all_files = os.listdir(source_dir)
    except Exception as e:
        print(f"❌ Lỗi: Không thể đọc các tệp từ thư mục nguồn: {e}")
        return
        
    files_to_process = [f for f in all_files if f.endswith('.mp3') and re.match(r'^\d+_', f)]

    if not files_to_process:
        print("🤷 Không tìm thấy tệp MP3 nào phù hợp để xử lý trong thư mục này.")
        return

    files_to_process.sort(key=lambda f: int(f.split('_')[0]))

    # --- 4. Xử lý, đổi tên và sao chép tệp ---
    print("🚀 Bắt đầu quá trình đổi tên và sao chép các tệp...")
    count_success = 0
    for index, old_name in enumerate(files_to_process):
        try:
            new_name = rename_callback(index, old_name)
            source_path = os.path.join(source_dir, old_name)
            dest_path = os.path.join(dest_dir, new_name)
            
            shutil.copy(source_path, dest_path)
            print(f"  ✅ '{old_name}'  -->  '{new_name}'")
            
            # --- THAY ĐỔI: Log lại cả tên cũ và tên mới ---
            log_list.append(f"{old_name}  -->  {new_name}")
            
            count_success += 1
        except Exception as e:
            print(f"  ❌ Gặp lỗi khi xử lý tệp '{old_name}': {e}")

    print(f"\n✨ Hoàn tất! Đã xử lý và sao chép thành công {count_success} tệp.")
    print("-" * 50)


# --- VÍ DỤ SỬ DỤNG ---
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    successful_renames = []

    LESSON = 4

    PROCESS_FOLDER = os.path.join(script_dir, 'process')
    DESTINATION_FOLDER = os.path.join(script_dir, 'test')
    
    def vocabLogic(index, old_filename):
        return f"lesson-{LESSON}_vocab-{index + 1}.mp3"
        
    def vocabExampleLogic(index, old_filename):
        return f"lesson-{LESSON}_vocab-{index + 1}_example.mp3"
    
    SOURCE_VOCAB_FOLDER = PROCESS_FOLDER
    SOURCE_VOCAB_EXAMPLE_FOLDER = os.path.join(PROCESS_FOLDER, 'vocab_example')
    
    print("Bắt đầu xử lý file TỪ VỰNG (trong thư mục 'process')...")
    process_and_copy_mp3s(SOURCE_VOCAB_FOLDER, DESTINATION_FOLDER, vocabLogic, successful_renames)
    
    print("Bắt đầu xử lý file VÍ DỤ TỪ VỰNG...")
    process_and_copy_mp3s(SOURCE_VOCAB_EXAMPLE_FOLDER, DESTINATION_FOLDER, vocabExampleLogic, successful_renames)

    print("Bắt đầu quét và xử lý các thư mục HỘI THOẠI...")
    try:
        all_items_in_process = os.listdir(PROCESS_FOLDER)
        conversation_folders = sorted([
            d for d in all_items_in_process 
            if d.startswith('conversation_') and os.path.isdir(os.path.join(PROCESS_FOLDER, d))
        ])

        if not conversation_folders:
            print("🤷 Không tìm thấy thư mục hội thoại nào để xử lý.")
        
        for folder_name in conversation_folders:
            try:
                conv_number = int(folder_name.split('_')[1])
                current_conv_path = os.path.join(PROCESS_FOLDER, folder_name)
                
                dynamic_conv_logic = lambda index, old_filename, c_num=conv_number: \
                    f"lesson-{LESSON}_conv-{c_num}_line-{index}.mp3" 

                print(f"\n--- Đang xử lý thư mục: {folder_name} ---")
                process_and_copy_mp3s(current_conv_path, DESTINATION_FOLDER, dynamic_conv_logic, successful_renames)
                
            except (IndexError, ValueError):
                print(f"⚠️  Bỏ qua '{folder_name}' vì không thể trích xuất số thứ tự hội thoại hợp lệ.")

    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy thư mục '{PROCESS_FOLDER}' để quét các thư mục hội thoại.")

    # --- Ghi toàn bộ log ra file ---
    if successful_renames:
        log_file_path = os.path.join(script_dir, "rename_log.txt")
        print(f"\n✍️  Đang ghi log chi tiết vào file: '{log_file_path}'")
        try:
            with open(log_file_path, 'w', encoding='utf-8') as f:
                f.write(f"### LOG TÊN TỆP ĐÃ ĐỔI - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ###\n")
                f.write(f"Tổng cộng: {len(successful_renames)} tệp.\n")
                f.write("-" * 50 + "\n\n")
                # Ghi mỗi cặp tên cũ --> tên mới trên một dòng
                for log_entry in successful_renames:
                    f.write(log_entry + "\n")
            print("✅ Ghi log thành công.")
        except Exception as e:
            print(f"❌ Lỗi khi ghi file log: {e}")
    else:
        print("\nℹ️  Không có tệp nào được xử lý, không cần ghi log.")