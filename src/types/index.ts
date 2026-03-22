export interface VodItem {
  vod_id: number;
  vod_name: string;
  type_id: number;
  type_id_1?: number;
  type_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_play_url: string;
  vod_play_from?: string;
  vod_blurb?: string;
  vod_content?: string;
  vod_year?: string;
  vod_area?: string;
  vod_lang?: string;
  vod_actor?: string;
  vod_director?: string;
  vod_score?: string;
  vod_tag?: string;
  vod_class?: string;
  vod_duration?: string;
  vod_time?: string;
  vod_isend?: number;
  vod_total?: number;
  vod_pubdate?: string;
}

export interface CategoryItem {
  type_id: number;
  type_pid: number;
  type_name: string;
}

export interface ApiListResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: Partial<VodItem>[];
  class?: CategoryItem[];
}

export interface ApiDetailResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: VodItem[];
}

export interface PlaySource {
  name: string;
  episodes: Episode[];
}

export interface Episode {
  name: string;
  url: string;
}
