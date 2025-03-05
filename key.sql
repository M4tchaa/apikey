-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 05, 2025 at 08:16 AM
-- Server version: 10.6.21-MariaDB-cll-lve
-- PHP Version: 8.3.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `yukngaj1_key`
--

-- --------------------------------------------------------

--
-- Table structure for table `amazing_challenge`
--

CREATE TABLE `amazing_challenge` (
  `id_challenge` bigint(20) NOT NULL,
  `id_participant` bigint(20) NOT NULL,
  `level` int(11) DEFAULT NULL,
  `day` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `group_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `id_mentor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id_modules` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `video_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qna`
--

CREATE TABLE `qna` (
  `id_qna` bigint(20) NOT NULL,
  `id_participant` bigint(20) NOT NULL,
  `theme` enum('Akidah','Sejarah','Syariah','Dakwah') NOT NULL,
  `question` text NOT NULL,
  `answer` text DEFAULT NULL,
  `id_answered_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz`
--

CREATE TABLE `quiz` (
  `id_quiz` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `theme` enum('Akidah','Sejarah','Syariah','Dakwah') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id_attempt` bigint(20) NOT NULL,
  `id_participant` bigint(20) NOT NULL,
  `id_quiz` bigint(20) NOT NULL,
  `score` int(11) DEFAULT NULL,
  `attempt_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id_question` bigint(20) NOT NULL,
  `id_quiz` bigint(20) NOT NULL,
  `question` text NOT NULL,
  `option_a` text NOT NULL,
  `option_b` text NOT NULL,
  `option_c` text NOT NULL,
  `option_d` text NOT NULL,
  `correct_option` char(1) DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` bigint(20) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','pembimbing','admin','peserta') DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_verified` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `username`, `email`, `password`, `role`, `deleted`, `created_at`, `is_verified`) VALUES
(3, 'matcha', 'arliyandi@yukngajibogor.com', '$2b$10$zz/CIh7GYuc0kC2O/2edAu0vzgwcK.VfHEuffW8SvNZHMP6RptgNW', 'admin', 0, '2025-02-26 08:12:09', 1),
(7, 'developer', 'developer@yukngajibogor.com', '$2b$10$nIpV/R0aGwCnhYKxD9lJg.zGRCArhbk0ClisprKa003sFkkT0G7XK', 'admin', 0, '2025-02-26 09:05:57', 1),
(10, 'rayhan', 'raihan.hafidz.syafie@gmail.com', '$2b$10$cMU6vBq1.NgngFoT5T7h2uHt16YN9sNX9eiI5HtZ.EbFZ4KdTfiwm', NULL, 0, '2025-02-26 14:08:51', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id_profile` bigint(20) NOT NULL,
  `id_user` bigint(20) NOT NULL,
  `hobby` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `subdistrict` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `city` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `completed_profile` tinyint(1) DEFAULT 0,
  `age` int(11) NOT NULL,
  `status` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `amazing_challenge`
--
ALTER TABLE `amazing_challenge`
  ADD PRIMARY KEY (`id_challenge`),
  ADD KEY `id_peserta` (`id_participant`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`group_id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id_modules`);

--
-- Indexes for table `qna`
--
ALTER TABLE `qna`
  ADD PRIMARY KEY (`id_qna`),
  ADD KEY `id_peserta` (`id_participant`),
  ADD KEY `id_answered_by` (`id_answered_by`);

--
-- Indexes for table `quiz`
--
ALTER TABLE `quiz`
  ADD PRIMARY KEY (`id_quiz`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id_attempt`),
  ADD KEY `id_peserta` (`id_participant`),
  ADD KEY `id_kuis` (`id_quiz`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id_question`),
  ADD KEY `id_kuis` (`id_quiz`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id_profile`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_user` (`id_user`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `amazing_challenge`
--
ALTER TABLE `amazing_challenge`
  MODIFY `id_challenge` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `group_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id_modules` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qna`
--
ALTER TABLE `qna`
  MODIFY `id_qna` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz`
--
ALTER TABLE `quiz`
  MODIFY `id_quiz` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id_attempt` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id_question` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id_profile` bigint(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
