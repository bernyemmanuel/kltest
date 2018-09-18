# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.16)
# Database: kalhatti-new
# Generation Time: 2017-11-02 02:12:10 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table asset_categories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `asset_categories`;

CREATE TABLE `asset_categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;

INSERT INTO `asset_categories` (`id`, `category_name`)
VALUES
	(1,'Internet'),
	(2,'Social'),
	(3,'E-Commerce'),
	(4,'Aerospace'),
	(5,'Technology');

/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

# Dump of table asset_price
# ------------------------------------------------------------

DROP TABLE IF EXISTS `asset_price`;

CREATE TABLE `asset_price` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) unsigned NOT NULL,
  `price` float(9,2) NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id_price` (`asset_id`),
  CONSTRAINT `asset_id_price` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Dump of table asset_promoted
# ------------------------------------------------------------

DROP TABLE IF EXISTS `asset_promoted`;

CREATE TABLE `asset_promoted` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) unsigned NOT NULL,
  `label` varchar(20) NOT NULL DEFAULT '',
  `image` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_promoted_asset_id` (`asset_id`),
  CONSTRAINT `asset_promoted_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `asset_promoted` WRITE;
/*!40000 ALTER TABLE `asset_promoted` DISABLE KEYS */;

INSERT INTO `asset_promoted` (`id`, `asset_id`, `label`, `image`)
VALUES
	(4,1,'TRENDING','https://blog1.fkimg.com/wp-content/uploads/2017/03/Panama-City-Beach-Florida-Friends-Summer-Beach-House.jpg'),
	(5,2,'FEATURED','http://i.dailymail.co.uk/i/pix/tm/2008/08/holidayhome_428x269_to_468x312.jpg');

/*!40000 ALTER TABLE `asset_promoted` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table assets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `assets`;

CREATE TABLE `assets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `market_value` real DEFAULT NULL,
  `description` text DEFAULT NULL,
  `risk_factor` varchar(100) DEFAULT NULL,
  `asset_category_id` varchar(10) NOT NULL DEFAULT '',
  `symbol` varchar(5) DEFAULT NULL,
  `perc_change` real DEFAULT NULL,
  /*`ceo` varchar(100) DEFAULT NULL,
  `headquarters` varchar(100) DEFAULT NULL,
  `founded` int(4) DEFAULT NULL,
  `employees` int(8) DEFAULT NULL,*/
  `trending` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Dump of table document_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `document_type`;

CREATE TABLE `document_type` (
  `id` tinyint(2) unsigned NOT NULL AUTO_INCREMENT,
  `document_type` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `document_type` WRITE;
/*!40000 ALTER TABLE `document_type` DISABLE KEYS */;

INSERT INTO `document_type` (`id`, `document_type`)
VALUES
	(1,'Form 1B'),
	(2,'Form 1A');

/*!40000 ALTER TABLE `document_type` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table promo_codes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `promo_codes`;

CREATE TABLE `promo_codes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(9) NOT NULL DEFAULT '',
  `count` int(5) unsigned NOT NULL,
  `description` text,
  `amount_precentage` float NOT NULL,
  `max_amount` int(3) NOT NULL,
  `promo_type` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `promo_type` (`promo_type`),
  CONSTRAINT `promo_type` FOREIGN KEY (`promo_type`) REFERENCES `promo_types` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `promo_codes` WRITE;
/*!40000 ALTER TABLE `promo_codes` DISABLE KEYS */;

INSERT INTO `promo_codes` (`id`, `code`, `count`, `description`, `amount_precentage`, `max_amount`, `promo_type`)
VALUES
	(3,'kp-123456',10,NULL,0.1,10,1),
	(5,'kp-123457',10,NULL,0.05,10,1),
	(6,'kp-333333',100,NULL,0.1,100,1),
	(7,'kp-444444',100,NULL,0.15,100,1);

/*!40000 ALTER TABLE `promo_codes` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table promo_types
# ------------------------------------------------------------

DROP TABLE IF EXISTS `promo_types`;

CREATE TABLE `promo_types` (
  `id` tinyint(1) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `promo_types` WRITE;
/*!40000 ALTER TABLE `promo_types` DISABLE KEYS */;

INSERT INTO `promo_types` (`id`, `type`)
VALUES
	(1,'Cashback');

/*!40000 ALTER TABLE `promo_types` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table support_requests
# ------------------------------------------------------------

DROP TABLE IF EXISTS `support_requests`;

CREATE TABLE `support_requests` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uid-message` (`uid`),
  CONSTRAINT `uid-message` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `support_requests` WRITE;
/*!40000 ALTER TABLE `support_requests` DISABLE KEYS */;

INSERT INTO `support_requests` (`id`, `uid`, `message`)
VALUES
	(1,46,'Testing'),
	(2,46,'Test'),
	(3,46,'Test'),
	(4,46,'Test'),
	(5,46,'Test'),
	(6,46,'Test'),
	(7,46,'Test');

/*!40000 ALTER TABLE `support_requests` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table user_asset_transactions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_asset_transactions`;

CREATE TABLE `user_asset_transactions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `asset_id` int(11) unsigned NOT NULL,
  `asset_quantity` float(5,3) NOT NULL,
  `amount` float(6,2) NOT NULL,
  `transaction_type` enum('BUY','SELL') DEFAULT NULL,
  `payment_method` enum('UPI','CARD','BANK','WALLET') DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount_from_wallet` float(6,2) NOT NULL DEFAULT '0.00',
  `price_per_asset` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uset_asset_transaction_asset_id` (`asset_id`),
  KEY `user_asset_transaction_uid` (`uid`),
  CONSTRAINT `user_asset_transaction_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE,
  CONSTRAINT `uset_asset_transaction_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_assets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_assets`;

CREATE TABLE `user_assets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `asset_id` int(11) unsigned NOT NULL,
  `quantity` float(5,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_id` (`asset_id`,`uid`),
  KEY `user_asset_uid` (`uid`),
  CONSTRAINT `user_asset_asse-id` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `user_asset_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_details
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_details`;

CREATE TABLE `user_details` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `aadhar_number` bigint(12) NOT NULL,
  `aadhar_image` varchar(22) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pan` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `uid` int(9) unsigned NOT NULL,
  `ethereum_public_address` varchar(42) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `aadhar` (`aadhar_number`),
  KEY `uid_fk` (`uid`),
  CONSTRAINT `uid_fk` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_details_verification_pending
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_details_verification_pending`;

CREATE TABLE `user_details_verification_pending` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `aadhar_number` bigint(12) NOT NULL,
  `aadhar_image` varchar(22) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_documents
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_documents`;

CREATE TABLE `user_documents` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `document_type_id` tinyint(2) unsigned NOT NULL,
  `url` varchar(250) NOT NULL DEFAULT '',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `meta_data` text,
  PRIMARY KEY (`id`),
  KEY `document-document_type` (`document_type_id`),
  KEY `uid-document_uid` (`uid`),
  CONSTRAINT `document-document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_type` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `uid-document_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_followed_assets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_followed_assets`;

CREATE TABLE `user_followed_assets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `asset_id` int(11) unsigned NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `User_followed_assets_uid` (`uid`),
  KEY `user_followed_assets_asset_id` (`asset_id`),
  CONSTRAINT `User_followed_assets_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`),
  CONSTRAINT `user_followed_assets_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table user_promo_used
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_promo_used`;

CREATE TABLE `user_promo_used` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `promo_code` varchar(9) NOT NULL DEFAULT '',
  `redeemed` tinyint(1) DEFAULT '0',
  `added_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_referal` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Dump of table user_wallet
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_wallet`;

CREATE TABLE `user_wallet` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `amount` float(6,2) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`),
  CONSTRAINT `uid` FOREIGN KEY (`uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `uid` int(9) unsigned NOT NULL AUTO_INCREMENT,
  `mobile_number` bigint(10) NOT NULL,
  `email_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_code` enum('+91','+1') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` enum('ANDROID','IOS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `referrer_uid` int(10) unsigned DEFAULT NULL,
  `referal_code` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `passcode` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(45) DEFAULT NULL,
  `last_name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  UNIQUE KEY `referal_code` (`referal_code`),
  KEY `referrer_uid` (`referrer_uid`),
  CONSTRAINT `referrer_uid` FOREIGN KEY (`referrer_uid`) REFERENCES `users` (`uid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table verification_request
# ------------------------------------------------------------

DROP TABLE IF EXISTS `verification_request`;

CREATE TABLE `verification_request` (
  `mobile_number` bigint(10) NOT NULL,
  `request_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  UNIQUE KEY `mobile_number` (`mobile_number`),
  CONSTRAINT `mobile_number_user_verfication_request` FOREIGN KEY (`mobile_number`) REFERENCES `users` (`mobile_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
