package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

// writeJSON はオブジェクトを JSON として書き込みます。
func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func main() {
	var mu sync.Mutex
	endHits := 0

	// APIエンドポイントのハンドラを登録します。
	http.HandleFunc("/api/v1/hello", func(w http.ResponseWriter, r *http.Request) {
		// CORS（Cross-Origin Resource Sharing）ヘッダーを設定
		// これにより、ポート8080のページからポート8081のAPIを呼び出せるようになります。
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:8080")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// GETリクエストのみを受け付けます。
		if r.Method != http.MethodGet {
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
			return
		}

		// URLのクエリパラメータを取得します。
		queryParam := r.URL.Query().Get("parameter")
		if queryParam == "" {
			queryParam = "パラメータが指定されていません"
		}

		// レスポンスデータを生成して返す
		writeJSON(w, map[string]string{"contents": "your request parameter is " + queryParam})
	})

	// internal: stats と reset
	http.HandleFunc("/internal/stats", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		v := endHits
		mu.Unlock()
		writeJSON(w, map[string]int{"end_hits": v})
	})
	http.HandleFunc("/internal/reset", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		endHits = 0
		mu.Unlock()
		writeJSON(w, map[string]string{"status": "ok"})
	})

	// HTTPサーバー（ポート8080）とAPIサーバー（ポート8081）を並行して起動
	go func() {
		log.Println("ウェブサーバーを起動しました。 http://localhost:8080 にアクセスしてください。")
		if err := http.ListenAndServe(":8080", http.FileServer(http.Dir("."))); err != nil {
			log.Fatalf("ウェブサーバーの起動に失敗しました: %v", err)
		}
	}()

	// APIサーバー（ポート8081）を並行して起動
	go func() {
		log.Println("APIサーバーを起動しました。 http://localhost:8081/api/v1/hello にアクセスしてください。")
		if err := http.ListenAndServe(":8081", nil); err != nil {
			log.Fatalf("APIサーバーの起動に失敗しました: %v", err)
		}
	}()

	// 追加: ポート8082で /api/v2/end を提供する簡易サーバ
	http.HandleFunc("/api/v2/end", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:8080")
		if r.Method != http.MethodGet {
			http.Error(w, "許可されていないメソッドです", http.StatusMethodNotAllowed)
			return
		}
		mu.Lock()
		endHits++
		mu.Unlock()
		writeJSON(w, map[string][]string{"contents": {"end"}})
	})

	log.Println("追加APIサーバーを起動しました。 http://localhost:8082/api/v2/end にアクセスしてください。")
	if err := http.ListenAndServe(":8082", nil); err != nil {
		log.Fatalf("追加APIサーバーの起動に失敗しました: %v", err)
	}
}

// // OS終了シグナルを待つためのダミーコード
// func init() {
// 	go func() {
// 		os.Exit(0)
// 	}()
// }
