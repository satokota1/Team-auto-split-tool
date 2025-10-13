import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Player } from '@/types'

// 既存プレイヤーのサブロールを90%に更新する関数
export async function updateSubRatesTo90Percent(): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    console.log('既存プレイヤーのサブロールを90%に更新を開始します...')
    
    // 全プレイヤーを取得
    const querySnapshot = await getDocs(collection(db, 'players'))
    const players = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Player & { id: string })[]

    let updatedCount = 0
    const updatePromises = []

    for (const player of players) {
      // サブロールを90%に再計算
      const newSubRate = Math.round(player.mainRate * 0.9)
      
      // 現在のサブロールと異なる場合のみ更新
      if (player.subRate !== newSubRate) {
        const playerRef = doc(db, 'players', player.id)
        updatePromises.push(
          updateDoc(playerRef, {
            subRate: newSubRate
          })
        )
        console.log(`プレイヤー ${player.name} のサブロールを更新: ${player.subRate} → ${newSubRate}`)
        updatedCount++
      }
    }

    // 全ての更新を実行
    await Promise.all(updatePromises)
    
    console.log(`全てのプレイヤーのサブロール更新が完了しました！${updatedCount}人のプレイヤーを更新しました。`)
    
    return {
      success: true,
      updatedCount
    }
  } catch (error) {
    console.error('サブロール更新中にエラーが発生しました:', error)
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
