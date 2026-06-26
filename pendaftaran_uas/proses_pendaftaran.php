<?php
// Pastikan header JSON diletakkan di bagian paling atas agar browser tahu ini data API
header('Content-Type: application/json');

$targetDir = "images/"; // Folder tujuan untuk menyimpan pas foto
$response = array("status" => "error", "message" => "Terjadi kesalahan sistem.");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. CEK APAKAH USER MENGUNGGAH FOTO BARU
    if (!empty($_FILES["foto"]["name"])) {
        
        $fileName = basename($_FILES["foto"]["name"]);
        // Menambahkan fungsi time() agar nama file unik jika ada mahasiswa mengunggah nama file yang sama
        $uniqueFileName = time() . "_" . $fileName; 
        $targetFilePath = $targetDir . $uniqueFileName; // Hasilnya: images/123456_foto.jpg
        $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
        
        $allowTypes = array('jpg', 'png', 'jpeg');
        
        if (in_array($fileType, $allowTypes)) {
            // Validasi ukuran di sisi server (Maksimal 2MB)
            if ($_FILES["foto"]["size"] <= 2 * 1024 * 1024) {
                
                // Proses pemindahan file fisik dari memori sementara ke folder images
                if (move_uploaded_file($_FILES["foto"]["tmp_name"], $targetFilePath)) {
                    
                    // JIKA MODE EDIT: Hapus foto lama dari folder images agar server tidak penuh
                    if (!empty($_POST['foto_lama']) && file_exists($_POST['foto_lama'])) {
                        // Menghapus berkas lama secara permanen dari server
                        unlink($_POST['foto_lama']); 
                    }

                    $response["status"] = "success";
                    $response["message"] = "Data berhasil diperbarui dengan foto baru!";
                    $response["filePath"] = $targetFilePath; // Mengirim balik alamat path "images/namafile.jpg"
                } else {
                    $response["message"] = "Gagal menyimpan foto ke folder server.";
                }
                
            } else {
                $response["message"] = "Ukuran file foto melebihi batas maksimal 2MB.";
            }
        } else {
            $response["message"] = "Format file salah. Server hanya menerima JPG/JPEG/PNG.";
        }
        
    } else {
        // 2. JIKA TIDAK ADA FOTO BARU YANG DIUNGGAH
        // Cek apakah ada kiriman data 'foto_lama' (Berarti user melakukan edit teks saja)
        if (!empty($_POST['foto_lama'])) {
            
            $response["status"] = "success";
            $response["message"] = "Data berhasil diperbarui (Foto tidak diubah).";
            $response["filePath"] = $_POST['foto_lama']; // Kirim balik path lama untuk ditampilkan di Card Summary
            
        } else {
            // Kondisi jika pendaftaran awal baru tetapi fotonya kosong
            $response["message"] = "Pas foto wajib diunggah.";
        }
    }
}

// Mengirimkan enkripsi data akhir kembali ke script.js
echo json_encode($response);
exit;
?>