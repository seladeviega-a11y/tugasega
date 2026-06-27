# StitchControl AI

**Sistem Monitoring Produksi Finishing Embroidery Berbasis Web**

---

## 📌 Tentang Proyek

StitchControl AI adalah aplikasi web untuk memonitor dan mengelola proses produksi finishing embroidery secara real-time. Aplikasi ini membantu operator mencatat hasil produksi harian dan memudahkan leader/admin dalam memantau kinerja produksi.

---

## 🎯 Tujuan

1. Memudahkan operator mencatat hasil produksi per jam
2. Menyediakan dashboard monitoring real-time untuk leader
3. Melacak dan mengelola kendala produksi
4. Menghasilkan laporan produksi harian

---

## 👥 Pengguna

| Role | Tanggung Jawab |
|------|----------------|
| **Operator** | Mencatat output, lapor kendala, lihat riwayat |
| **Leader/Admin** | Monitoring, kelola data, laporan |

---

## ⚡ Fitur

### 🔐 Autentikasi
- Login & Logout
- Registrasi (khusus operator)
- Role-based access control
- Proteksi halaman berdasarkan role

### 👷 Operator
| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Ringkasan produksi harian |
| Input Output | Rekam hasil produksi per jam |
| Laporkan Kendala | Laporkan kendala produksi |
| Riwayat Produksi | Lihat data output yang telah diinput |

### 📊 Leader / Admin
| Fitur | Deskripsi |
|-------|-----------|
| Dashboard Monitoring | Pantau produksi real-time |
| Kelola Data Produksi | Tambah style, lot, target, assignment |
| Monitoring Real Time | Output per operator & selisih target |
| Monitoring Kendala | Kelola kendala & status |
| Laporan Produksi | Generate & export PDF |

---

## 🛠️ Teknologi

| Frontend | Backend | Deployment |
|----------|---------|------------|
| React 18 | Supabase | Netlify |
| Vite | PostgreSQL | Vercel |
| React Router | - | - |
| CSS3 | - | - |

---

## 🗄️ Struktur Database

```sql
profiles (id, name, role, employee_id, created_at)
styles (id, name, target_per_hour, process_type, created_at)
lots (id, style_id, lot_number, target_total, priority, status, created_at)
assignments (id, operator_id, lot_id, assigned_date, active)
hourly_outputs (id, operator_id, lot_id, jam, qty, style, remark, created_at)
constraints (id, operator_id, lot_id, jenis, durasi, keterangan, jam, status, leader_note, created_at)
