$(document).ready(function() {
    //Buat penampung/placeholder kotak abu-abu kosong sebelum mahasiswa upload foto asli.
    const gambarKosong = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='105' height='140' viewBox='0 0 105 140'><rect width='100%' height='100%' fill='%23f0f0f0'/></svg>";
    
    //Karena kita memanipulasi DOM atribut 'src' pada tag #previewFoto menggunakan variabel gambarKosong di atas.
    $("#previewFoto").attr("src", gambarKosong);

   
    //BAGIAN 1: ATURAN VALIDASI INPUTAN (JQUERY VALIDATE)
    $("#formPendaftaran").validate({
        ignore: [], 
        rules: {
            nim: { required: true, digits: true, minlength: 8 },
            nama: { required: true, minlength: 5 },
            email: { required: true, email: true },
            nohp: { required: true, digits: true, minlength: 10 },
            jk: { required: true },
            prodi: { required: true },
            alamat: { required: true, minlength: 10 },
          
            //Ini edit data! Kalau user sedang EDIT data dan sudah ada 'foto_lama', foto baru TIDAK WAJIB diunggah. Tapi kalau pendaftaran BARU (#foto_lama kosong), foto wajib diisi.
            foto: { 
                required: function() {
                    return $("#foto_lama").val() === "";
                }, 
                extension: "jpg|jpeg|png" 
            }
        },
        
       
        //Dari objek 'messages' ini. Jika inputan melanggar 'rules' di atas, kalimat di bawah ini yang akan keluar.
        messages: {
            nim: { required: "NIM tidak boleh kosong.", digits: "Harus berupa angka.", minlength: "Minimal 8 digit." },
            nama: { required: "Nama tidak boleh kosong.", minlength: "Minimal 5 karakter." },
            email: { required: "Email tidak boleh kosong.", email: "Harus sesuai format email." },
            nohp: { required: "Nomor HP wajib diisi.", digits: "Hanya boleh angka.", minlength: "Minimal 10 digit." },
            jk: { required: "Jenis kelamin wajib dipilih." },
            prodi: { required: "Program studi wajib dipilih." },
            alamat: { required: "Alamat wajib diisi.", minlength: "Minimal 10 karakter." },
            foto: { required: "Pas foto wajib diunggah.", extension: "Hanya menerima format JPG, JPEG, atau PNG." }
        },

        
        //Menggunakan fungsi 'errorPlacement'. Khusus gender dan foto dimasukkan ke container khusus (#error-jk / #error-foto). Sisanya otomatis meluncur di bawah inputan (.slideDown).
        errorPlacement: function(error, element) {
            if (element.attr("name") === "jk") {
                error.appendTo("#error-jk");
            } else if (element.attr("name") === "foto") {
                error.appendTo("#error-foto"); 
            } else {
                error.hide().insertAfter(element).slideDown("fast"); 
            }
        },
        
      
        //Diatur oleh fungsi 'success'. Pesan error akan meluncur ke atas lalu dihapus dari DOM (.remove).
        success: function(label, element) {
            if ($(element).attr("name") !== "jk" && $(element).attr("name") !== "foto") {
                label.slideUp("fast", function() { label.remove(); }); 
            } else {
                label.remove();
            }
        },


        //BAGIAN 2: PENGIRIMAN DATA KE SERVER (AJAX SUBMIT HANDLER)
        submitHandler: function(form) {
            
            //Validasi darurat lapis kedua. Memastikan user tidak mengakali sistem dengan mengirim form kosong saat foto belum siap.
            const fotoSekarang = $("#previewFoto").attr("src");
            if ((fotoSekarang === gambarKosong || $("#foto").val() === "") && $("#foto_lama").val() === "") {
                $("#error-foto").html("");
                $("<label class='error'>Pas foto wajib diunggah.</label>").appendTo("#error-foto").hide().slideDown("fast");
                return false; 
            }
            
           
            //Object JavaScript untuk membungkus seluruh data form. WAJIB pakai ini karena kita mengirim berkas FISIK (File Gambar Foto), bukan cuma teks biasa.
            var formData = new FormData(form);

           
            //AJAX mengirim data form ke 'proses_pendaftaran.php' secara background (tanpa reload halaman). Jika sukses dan dapat respons 'success', JavaScript akan melakukan Manipulasi DOM.
            $.ajax({
                url: "proses_pendaftaran.php", 
                type: "POST",
                data: formData,
                contentType: false,  
                processData: false,   
                dataType: "json",    
                success: function(response) {
                    if (response.status === "success") {
                        
                        //Menyimpan alamat path foto dari PHP (ex: images/123_foto.jpg) agar jika tombol Edit diklik, sistem tahu foto mana yang sedang aktif.
                        $("#foto_lama").val(response.filePath);

                        //Mengambil nilai input form (.val) lalu disuntikkan ke teks penampung Card Summary (.text).
                        $("#resNim").text($("#nim").val());
                        $("#resNama").text($("#nama").val());
                        $("#resEmail").text($("#email").val());
                        $("#resNoHp").text($("#nohp").val());
                        $("#resJk").text($("input[name='jk']:checked").val());
                        $("#resProdi").text($("#prodi").val());
                        $("#resAlamat").text($("#alamat").val());
                        
                        // Memasukkan path asli foto dari server ke bingkai foto Card Summary
                        $("#cardPreviewFoto").attr("src", response.filePath);

                        //Manipulasi DOM Efek Visual. Kotak Form di-fadeOut (dihilangkan perlahan), lalu Kotak Card Summary di-fadeIn (dimunculkan).
                        $("#boxForm").fadeOut("slow", function() {
                            $("#boxCard").fadeIn("slow");
                        });
                    } else {
                        alert(response.message);
                    }
                },
                error: function() {
                    alert("Gagal terhubung dengan server pengolahan PHP. Pastikan Apache XAMPP menyala!");
                }
            });

            return false; 
        }
    });

   
    //BAGIAN 3: TOMBOL EDIT DATA DIKLIK
    //Kebalikan dari submit. Kotak Card Summary kita fadeOut (hilangkan), lalu Kotak Form pendaftaran kita fadeIn (munculkan lagi) agar bisa diedit.
    $("#btnEdit").on("click", function() {
        $("#boxCard").fadeOut("slow", function() {
            $("#boxForm").fadeIn("slow");
        });
    });

    //BAGIAN 4: LOGIKA TOMBOL RESET (SAPU BERSIH)
    //Mengosongkan data form bawaan HTML, menghapus class error/valid dari css, menghapus sisa teks pesan merah error, dan mengembalikan foto ke kotak abu-abu default.
    $("#btnReset").on("click", function() {
        var validator = $("#formPendaftaran").validate();
        validator.resetForm();
        
        $("#formPendaftaran").find(".valid, .error").removeClass("valid error");
        $("label.error").remove();
        $("#error-jk").html("");
        $("#error-foto").html("");
        
        $("#formPendaftaran")[0].reset(); 
        
        $("#previewFoto").attr("src", gambarKosong);
        $("#namaFileSelected").text("Tidak ada file dipilih");
        $("#foto_lama").val(""); 
    });

    //BAGIAN 5: UPLOAD & VALIDASI FOTO SECARA REAL-TIME (LOKAL)
    //Menggunakan event listener '.on("change")' pada input file. Di sini kita langsung cegat ukuran & ekstensinya secara real-time di sisi client (browser).
    $("#foto").on("change", function() {
        const file = this.files[0];
        
        if (file) {
            $("#error-foto").html("");
            const detailBerkas = file.name + " (" + file.type + ")";
            $("#namaFileSelected").text(detailBerkas);

            // A. Validasi Ukuran File Lokal (Maksimal 2 MB)
            if (file.size > 2 * 1024 * 1024) {
                alert("Ukuran file melebihi 2 MB!");
                $(this).val(""); 
                const fallbackImg = $("#foto_lama").val() !== "" ? $("#foto_lama").val() : gambarKosong;
                $("#previewFoto").attr("src", fallbackImg);
                if($("#foto_lama").val() === "") {
                    $("#namaFileSelected").text("Tidak ada file dipilih");
                }
                return false;
            }

            // B. Validasi Ekstensi File Lokal
            const ext = file.name.split('.').pop().toLowerCase();
            if ($.inArray(ext, ['jpg', 'jpeg', 'png']) == -1) {
                alert("Format file salah! Harus JPG, JPEG, atau PNG.");
                $(this).val("");
                const fallbackImg = $("#foto_lama").val() !== "" ? $("#foto_lama").val() : gambarKosong;
                $("#previewFoto").attr("src", fallbackImg);
                if($("#foto_lama").val() === "") {
                    $("#namaFileSelected").text("Tidak ada file dipilih");
                }
                return false;
            }

            //Karena kita memakai 'FileReader()'. Dia membaca data file gambar dari komputer user secara lokal (.readAsDataURL) lalu hasilnya langsung ditempel ke atribut 'src' pada elemen #previewFoto.
            const reader = new FileReader();
            reader.onload = function(e) {
                $("#previewFoto").attr("src", e.target.result);
                $("#foto").valid(); 
            };
            reader.readAsDataURL(file);
        } else {
            const fallbackImg = $("#foto_lama").val() !== "" ? $("#foto_lama").val() : gambarKosong;
            $("#previewFoto").attr("src", fallbackImg);
            if($("#foto_lama").val() === "") {
                $("#namaFileSelected").text("Tidak ada file dipilih");
            }
        }
    });
});