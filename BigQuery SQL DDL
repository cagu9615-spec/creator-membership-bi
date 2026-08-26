-- Create isolated datasets for each architectural layer
CREATE SCHEMA IF NOT EXISTS `creator_raw` OPTIONS(location='US');
CREATE SCHEMA IF NOT EXISTS `creator_staging` OPTIONS(location='US');
CREATE SCHEMA IF NOT EXISTS `creator_dw` OPTIONS(location='US');
CREATE SCHEMA IF NOT EXISTS `creator_marts` OPTIONS(location='US');


-- Create the 4 architecture layers in BigQuery
CREATE SCHEMA IF NOT EXISTS `project-66ca72fe-f4e0-486b-ab0.creator_raw`
  OPTIONS(location='US');

CREATE SCHEMA IF NOT EXISTS `project-66ca72fe-f4e0-486b-ab0.creator_staging`
  OPTIONS(location='US');

CREATE SCHEMA IF NOT EXISTS `project-66ca72fe-f4e0-486b-ab0.creator_dw`
  OPTIONS(location='US');

CREATE SCHEMA IF NOT EXISTS `project-66ca72fe-f4e0-486b-ab0.creator_marts`
  OPTIONS(location='US');
