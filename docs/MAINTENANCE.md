# 바람목장 유지보수 안내

기본 화면과 동물은 ES 모듈 기반 Canvas 게임이며, 양 축사·목동 집·닭장 외관과 양 축사·목동 집·닭장·창고 실내는 Three.js로 그립니다. 브라우저는 프로젝트에 포함한 Three.js 파일을 불러오므로 외부 CDN이나 실행 전 빌드는 필요 없습니다.
기존 일러스트풍, 360도 카메라, 모바일 메뉴와 아바타 방향 전환을 유지합니다.

새 기능을 추가하거나 플레이 중 발견한 버그를 수정할 때는 [버그 기록과 재발 검사](REGRESSIONS.md)에서 같은 동작의 기존 사례를 먼저 확인합니다.

## 수정 위치

| 변경할 내용 | 담당 파일 |
| --- | --- |
| 동물 수, 활동 시간, 연못·창고 위치, 건초 수량 | `dist/game/config.js` |
| 양 생성, 이동·졸기·먹기·젖먹기·물 마시기, 어미와 새끼 연결 | `dist/game/flock.js` |
| 쓰다듬기·우유주기·옷 당기기, 카메라 저장·복귀, 건초 운반 | `dist/game/interactions.js` |
| 닭·양치기개 이동과 역할 | `dist/game/companions.js` |
| 울음소리, 거리·좌우 음량 | `dist/game/audio.js` |
| 양의 외형, 감은 눈, 접은 다리, 어미젖 표현 | `dist/render/sheep.js` |
| 닭과 개 외형 | `dist/render/companions.js` |
| 손·젖병·옷자락·들고 있는 건초 연출 | `dist/render/interactions.js` |
| 풀·들꽃·바닥 건초·물결 | `dist/render/details.js` |
| 시점 투영과 지면 클릭 역변환 | `dist/orbit.js` |
| 아바타 네 방향과 해먹 | `dist/visitor.js` |
| 메뉴로 기존 버튼을 이동하고 복귀 | `dist/mobile-ui.js` |
| 입력 이벤트와 서비스 연결, 화면 순서 | `dist/app.js` |

## 지켜야 하는 규칙

- 양의 행동은 `Flock.tick()`이 관리합니다. 다른 파일에서 별도의 AI 타이머를 만들지 않습니다.
- 교감 중에는 `Interactions`가 `Flock.lock()`으로 해당 양을 예약합니다. 모든 종료·취소 경로에서 `unlock()`합니다.
- 어미젖 먹기는 어미의 `nursingWith`로 한 쌍만 예약합니다. 먹이·교감으로 중단할 때 `releasePair()`로 양쪽을 해제합니다.
- 새끼의 `mother`와 1/3 크기 관계는 생성 시 고정합니다. 화면 크기에 따라 새끼 크기 자체를 바꾸지 않습니다.
- 우유는 새끼에게만, 완료 시 한 번만 반영합니다. 잠깐 중단해도 휴식 시간이 적용됩니다.
- 건초는 실제로 창고에 도착한 뒤에 들 수 있습니다. 내려놓으면 들고 있는 상태가 해제되고, 먹는 수량은 0보다 작아질 수 없습니다.
- 카메라 확대는 교감 시작 전 값을 저장합니다. 완료·중단·드래그·핀치·키보드·앉기·해먹 전환 시 복귀합니다.
- 모바일 버튼을 복제하지 않습니다. 같은 DOM 노드를 이동시켜 이벤트와 상태가 한 벌만 존재하게 합니다.
- 폰 기본 화면에는 메뉴와 먹이주기만 표시합니다. 교감/우유/창고 이동 중에만 작은 취소 버튼이 나타납니다.
- 브라우저 프레임마다 새 interval이나 requestAnimationFrame을 만들지 않습니다. 앱의 단일 프레임 루프가 모든 모듈을 갱신합니다.
- 동물·식물·건초·물결은 모두 같은 `project()` 함수를 사용하며, 화면의 가짜 좌표를 저장해 이동시키지 않습니다.

## 검증

프로젝트 루트에서 `npm test`를 실행합니다. 의존성 설치는 필요 없습니다.

검증 범위: 360도 지면 클릭, 확대와 드래그 오작동, 아바타 방향, 고정 먹이 자리,
어미/새끼 연결, 교감 후 카메라 복귀, 우유 제한, 창고 도착/건초 중복 소비,
단일 옷 당기기 예약, 다양한 프레임 시간의 장시간 동물 시뮬레이션.

UI 수정 시에는 390×760과 320×568의 실제 iframe viewport 또는 휴대폰에서
입장·메뉴·해먹·우유 모드·양 클릭·교감 취소를 확인합니다.
배포 전에 QA 전용 HTML이 dist에 남지 않았는지 확인합니다.

## 구현 범위

울음은 외부 녹음 파일 대신 Web Audio로 합성한 조용한 울음입니다.
물고기나 젖소는 추가하지 않았습니다. 양 50마리와 새끼 12마리, 닭 10마리, 개 2마리입니다.
양 축사·목동 집·닭장 외관과 출입 가능한 실내는 Three.js 입체 모델입니다. 동물과 배경은 기존 일러스트 표현을 유지합니다.
배경음악은 사용자가 제공한 Pastoral Loop.mp3를 사용합니다.

옷 당기기는 교감 확대를 사용하지 않습니다. 양이 옷 끝까지 접근한 뒤 짧은 옷 주름만 그립니다. 입과 옷자락 간격은 `tests/tug.mjs`가 여러 카메라 각도에서 검증합니다. 긴 연결선이나 팔 올리기 동작을 추가하지 마세요.

우유주기는 `render/milk-pose.js`의 고정 길이 팔과 무릎 굽힌 전용 자세를 사용합니다. 서 있는 어깨에서 새끼 입까지 연결선을 그리지 않습니다. 양 옆 0.82 거리의 마른 지점에 도착한 뒤 시작하며 `tests/milk-pose.mjs`가 자세와 거리를 검증합니다.

보행 관절은 `game/gait.js`에서 계산합니다. 무릎은 진행 방향의 수직 평면에서만 굽히고, 정면/뒷모습의 다리 가로 위치는 고정합니다. `tests/gait.mjs`는 뼈 길이, 무릎 굽힘 방향, 발 교대, 디딤발과 발 들기를 검증합니다. 우유 주기의 무릎 굽힌 자세는 별도 모듈이라 영향을 받지 않습니다.

교감 예약과 실제 접촉은 다릅니다. `careContact`는 다가가기를 완료하고 손길/젖병 동작이 시작될 때만 true로 설정합니다. 눈 감기·볼 표현은 이 값에 따르고, 취소와 완료는 unlock에서 해제합니다. `tests/contact-eyes.mjs`가 실제 양 렌더러의 접근/접촉/종료 표현을 검증합니다.

합성 바람 잡음은 제거했습니다. 현재 소리 버튼은 음악과 양 울음을 함께 제어합니다. 배경음악은 사용자 MP3를 반복 재생합니다.

배경음악은 `dist/assets/pastoral-loop.mp3`입니다. `MeadowAudio`가 HTMLAudioElement 하나로 스트리밍하며 loop=true, volume=0.45로 재생합니다. 소리 버튼은 음악과 양 울음을 함께 제어하고, 끄면 현재 위치에서 일시정지합니다. MP3 전체를 PCM으로 메모리에 올리지 않습니다. 연속 클릭은 진행 중인 재생 요청 하나로 합쳐 처리합니다. 바람 소리는 생성하지 않습니다.

간소한 UI는 너비 700px 이하 **또는 높이 540px 이하**에서 사용합니다. `game/layout.js`의 COMPACT_UI_QUERY와 style.css의 미디어 쿼리를 함께 유지하세요. 폰 가로 회전은 너비가 커져도 높이가 낮으므로 PC 메뉴로 바뀌지 않습니다. tests/layout.mjs가 양쪽 기준과 대표 가로/세로 크기를 검증합니다.

소리는 옵션 없이 목장 입장 버튼의 사용자 동작에서 자동 시작합니다. 별도 소리 버튼은 제거했으며 기기 볼륨을 사용합니다. MeadowAudio.start()는 멱등성이 있어 반복 호출해도 꺼지거나 중복 재생되지 않습니다. 브라우저가 차단할 때는 다음 정상 터치에서만 재시도합니다.

해먹: CONFIG.hammock을 일반 player.tx/tz 보행 목표로 사용합니다. 도착 거리 .08 이내에서만 눕고, 일어날 때도 현재 위치를 유지합니다. 다른 이동·돌봄 명령이나 취소 버튼은 cancelHammockWalk로 예약된 눕기를 해제합니다.


## Living meadow (12–16)
- `game/weather.js`: opt-in approximate location (rounded to .02°) or city lookup via Open-Meteo. Restores only chosen region; refreshes every 15 minutes, retries offline after 2 minutes, marks data older than 1 hour unavailable. Generation tokens reject older location responses. Actual region timezone and day/night; no fake live weather. Preview weather is explicit and never persisted.
- `game/bond.js`: per-browser `meadow.bond.v1` stores stable adult IDs, names and care points. Care contact earns points; feeding earns points; no absence penalty. At 6 points, a regular sheep recognizes the visitor and alternates following with grazing. Naming can choose the regular sheep before familiarity. No shared world, account, cross-device sync or cloud persistence is claimed. Save throttled to 2 seconds, on panel close and pagehide; blocked storage falls back to current visit.
- `game/shelter.js`: rain/snow 3-second entry and 20-second clearing debounce. Existing care cancelled on entry; sheep stop normal feeding/play/follow logic, walk via dry routes to barn entrance, become hidden only on arrival. Occupancy count is visible; exit is staggered with continuous movement. `companions.js` assigns dogs outside sheep to herd; one dog herds while the other escorts the boy when the NPC is present.
- `game/navigation.js`: dry-route visibility graph around pond for shelter trips. Future construction/pathfinding should extend this module, not put new movement rules in renderers.
- `game/lamb-play.js`: max two pairs, bounded hops with ground shadow, lock/feed/weather interrupts end both partners cleanly. Flock skips externally coordinated states to prevent double movement.
- `meadow-panel.js`: weather and naming UI in one native modal; mobile reuses actual buttons in existing drawer. `render/weather.js`, `render/shelter.js` own visuals only. Cached dependencies use living-meadow query tag.
- Weather data: Open-Meteo attribution in panel. Public API is used for this noncommercial prototype; before paid or large-scale launch, select a suitable service plan and add regional response caching. No per-user API secrets shipped in static client.
- Tests: `tests/living-meadow.mjs` covers network/time/storage failures and races, independent visitors, all 62 sheep taking shelter then leaving, dog movement, play interruption. Existing movement and audio regression suite remains required.

## 소년 목동
`game/shepherd.js` owns exactly one NPC and only changes its own state. `render/shepherd.js` draws the boy with camera-relative four-way facing and the shared tested gait. He greets at entry, walks dry routes to inspect sheep and barn, and watches the entrance in wet weather. Tapping him opens `shepherd-chat.js`; AI responses are served separately by `server/shepherd-api.js`. Movement and sheep care remain owned by their original controllers.

목동 지팡이/동행견: render/shepherd.js의 왼손 gripX에 짧은 나무 지팡이를 고정합니다. 오른손 인사와 보행에도 손과 지팡이가 분리되지 않도록 합니다. Companions의 escort 한 마리는 player가 아니라 shepherd를 따르며, 이 분기를 날씨 몰이보다 먼저 적용합니다. 목동을 먼저 갱신하고 개가 최신 위치를 따라가게 합니다. 연못을 피하는 경로, 정지/출발 거리 차이로 제자리 떨림을 막고 이동은 기존 속도 제한을 유지합니다.

## Recorded sheep calls
`game/audio.js` replaces the synthetic baa with the three original uploaded `assets/sheep-voice1/2/3.mp3` recordings. Decode each once after entry (music playback does not wait for downloads); per-clip gains [.72, .5, 1] balance measured levels. Existing flock timing selects the animal; audio randomly selects a recording, excludes immediate repeats, attenuates by distance and pans with camera yaw. One active source and a 2.5-second minimum interval prevent overlap. Missing/undecodable calls are omitted; no synthetic fallback. Sources disconnect on end/stop, and calls never resume after pausing. Background MP3 loop and automatic entry playback are unchanged. Hidden audio data attributes expose ready count/last call for browser playback verification.

## Side-on petting
`game/petting.js` chooses a dry left/right standing point from sheep size and the shortest camera rotation that places the pair horizontally side by side. Camera aligns during approach, eyes close only after arrival AND alignment. Pet zoom fits short screens; original camera restores exactly. `render/pet-pose.js` owns the bounded two-joint arm contacting the near fleece edge. The visitor omits its ordinary near arm during petting so there is no duplicate arm; lamb petting uses the existing kneeling body without a bottle. Milk and tug keep their own poses and approach rules.

Pet closeup composition: the chosen sheep and visitor render as one foreground pair among animals, with the same building-surface occlusion as other world sprites. Surrounding sheep, dogs, chickens and the shepherd render at full opacity during petting. Their world positions and behavior continue normally.

## 양치기 개와 닭장

`CONFIG.coop`은 양 축사 오른쪽에 있는 별도 닭장이다. 비·눈·밤 또는 목동의 모으기 명령으로 `WeatherShelter.active`가 되면 `Companions`가 닭을 `dryRoute()`로 닭장 입구까지 걷게 한다. 한 개는 양을, 다른 개는 닭을 우선 몰고, 한 무리가 먼저 들어가면 남은 무리를 돕는다. 닭은 입구에 도착한 뒤에만 `hiddenInCoop`이 되며, 날씨가 개면 순서대로 걸어 나온다. 동행견은 몰이가 끝나면 목동 곁으로 돌아간다.

닭장 외관과 쉬는 닭 수는 `render/shelter.js`의 `drawCoop()`이 그린다. 방문자는 닭장을 누르거나 닭장 둘러보기 버튼으로 문까지 걸어 들어가 내부를 둘러볼 수 있다. 양 축사 실내에는 양만 표시한다. `tests/coop.mjs`가 건물 간격, 개의 몰이, 닭의 연속 이동과 순차 출입을 확인한다.

## 목동과 강아지의 2층 숙소

`CONFIG.lodge`는 축사 뒤편에 간격을 두고 놓인 2층 집이다. 이전 버전 31의 평면 숙소 팝업은 방문자가 실제 방에 들어가 걸을 수 없어서 폐기했다. `game/lodge.js`의 `LodgeVisit`는 축사의 `BarnVisit`처럼 방문자를 문까지 걷게 하고, 실내 좌표로 전환한다. 1층에서 바닥을 눌러 이동하거나 WASD로 걸으며 침대, 식탁, 난로, 세면대, 책장과 두 개의 강아지 자리를 볼 수 있다. 계단을 누르거나 계단 버튼을 누르면 그곳까지 걸어간 뒤 2층으로 올라간다. 2층에서도 발코니를 걷고 같은 계단으로 내려오며, 퇴장하면 원래 목장 문 앞에 나온다.

`render/lodge-room-model.js`는 두 층의 실제 바닥·벽·천장·창문·가구·난간을 Three.js 메시로 만든다. 예전 `render/lodge.js`의 축소 모형 같은 실내 화면은 게임에서 사용하지 않는다. 2층 뒤편에는 `lookoutView`를 실제 숙소 위치에 고정해 기존 목장의 지형·축사·닭장·동물을 실시간으로 렌더링한다. 방문자가 카메라를 돌리면 전망 방향도 함께 변한다. 목동과 개가 쉬는 중이면 1층에서 그 캐릭터를 볼 수 있다. 모바일 메뉴도 동일한 숙소 진입 버튼을 사용한다.

비·눈·밤 또는 모으기 명령으로 모든 양이 축사에 들어가면 목동은 `dryRoute()`를 따라 숙소로 이동한다. 개들은 양과 닭의 몰이를 끝낸 다음 숙소로 걸어가 쉰다. 이때에만 목장 화면에서 숨기고 실내에 표시한다. 피신이 끝나면 모두 문 앞에서 다시 밖으로 나온다. `tests/lodge.mjs`는 건물 간격, 목동·개 이동, 방문자의 1층 진입·보행·계단·2층 보행·퇴장과 전망 시점의 숙소 위치를 검사한다.

## 목동과 대면 대화

목동 클릭과 대화 버튼은 `ShepherdBoy.requestTalk()`로 접근을 시작한다. 플레이어는 기존 이동 속도로 `dryRoute()`를 따라 걸으며 목동은 기다린다. `updateTalk()`가 약 1.8 거리 도착과 상호 방향을 정한 뒤에만 대화창을 연다. 숙소 대화는 1층의 실제 표시 위치를 사용한다. 다른 공간에 있으면 축사 출구·숙소·계단을 먼저 지나가며, 이동 취소 시 예약도 해제한다. 대화창 열기와 전송은 `canTalk()`로 거리를 검사하고, 대화 종료 후 목동은 순찰·날씨 피신 동작으로 돌아간다. 이동 입력과 다른 행동은 `cancelShepherdTalk()`로 대화를 끝낸다. `tests/shepherd.mjs`와 `tests/shepherd-chat.mjs`가 접근·대면·공간 분리·취소·대화창 조건을 검사한다.
## 손그림 새끼양

`asset/Ship-baby.psd`의 body, Lag, head 레이어를 `scripts/export-lamb-layers.py`로 내보낸다. 원본 PSD는 수정하지 않는다. 내보내기 도구에는 psd-tools, Pillow, numpy가 필요하며 게임 실행에는 Python이 필요 없다. `dist/assets/sheep/lamb/`에는 투명 몸통·머리·네 다리와 공통 좌표 정보만 저장한다. 그림 여백은 잘라 저장하고 렌더러에서 원래 위치에 조립한다. `render/lamb.js`는 이미지를 공유하며 다리 교대, 머리 움직임과 교감 중 눈 감기를 그린다. 모든 isLamb 개체가 이 그림을 사용하고, 어미/새끼의 크기 1/3 관계와 기존 행동은 Flock이 관리한다. 현재 화면 구성은 성체 45마리와 CONFIG.lambs의 새끼 12마리로 총 57마리다. `tests/lamb-sprite.mjs`가 자산 크기·정렬, 레이어 연결과 돌봄 동작을 검사한다.
## 확장한 연못

목장의 이동 경계를 가로·세로 각각 2배로 확대했다. 사람은 CONFIG.playerBounds의 220×400, 양의 기본 배회는 CONFIG.bounds의 300×450 좌표 범위를 사용한다. 실제 미터 단위로 지정한 값은 아니다. 울타리와 산책로는 새 경계를 따라 표시하며 동물·나무·풀의 전체 수를 늘리지 않고 일부 외곽 식생을 재배치했다.

호수는 중심 (-25,-9), 윤곽 기준 반경 (19×√2)×(11×√2)의 비대칭 곡선이다. 직전 호수와 모양을 유지하며 수면 면적을 정확히 2배로 늘렸다. CONFIG의 pondEdge, pondPoint, pondLevel을 수면 렌더링·충돌·우회 경로·식생 배제·물 마시는 자리에서 함께 쓴다. 내보인 물가와 실제 물 판정이 일치해야 한다. game/navigation.js는 호수 둘레 선분으로 경로 교차를 검사한다. 수면 다각형은 카메라의 가까운 면에서 잘라 가까이 가도 사라지지 않도록 한다.

연잎·연꽃·수초와 돌은 가장자리 무리로 배치한다. CONFIG.pond.openWater는 나중에 오리나 기러기가 머물 넓은 가운데 수면이며, 현재 물새 개체는 추가하지 않았다. tests/pond.mjs는 확장 경계·곡선 물가·우회 동선·수면 여유와 네 방향 렌더링을 확인한다. 설정 변경 시 의존 모듈 URL 버전도 갱신해 옛 물가 판정이 섞이지 않게 한다.

## 산자락 물길과 아치형 나무다리

`game/waterways.js`가 산자락 (-80,250)부터 호수 북쪽으로 들어오는 하천과 동쪽에서 남쪽 외곽으로 나가는 하천의 공통 곡선·폭을 관리한다. `render/waterways.js`는 먼 산, 둑, 수면과 흐르는 잔물결을 그린다. 호수와 하천 사이에는 수면 연결 패치를 그려 물가 테두리가 물길을 가로막아 보이지 않게 한다. `keepDry`, 식생 생성과 `navigation.js`도 같은 하천 좌표를 사용한다. 물가 나무는 기존 105그루 중 일부를 재배치했으며 동물 수는 늘리지 않았다.

`BRIDGE`는 유출 하천 (7,-24)에 놓인 길이 10.4, 폭 2.7, 중앙 높이 .95의 나무다리다. `render/bridge.js`가 판자·아치·양쪽 난간을 그린다. 방문자와 동물의 기본 발 위치에는 `bridgeHeight`를 사용하고, 다리 판자 클릭은 원근을 보정해 실제 판자 위의 좌표로 바꾼다. 실내 시점에는 이 높이를 적용하지 않는다. 긴 옆 난간을 가로질러 올라타는 경로는 거부하고 양쪽 끝으로만 진입한다.

풀밭 클릭과 해먹 이동은 `walkToOutdoor`의 `dryRoute`를 따라가며 다른 행동과 직접 이동 입력이 경로를 취소한다. `navigation.js`는 정적인 물가 우회 그래프를 한 번 만들고, 각 보행자의 시작·끝만 연결해 사용한다. 경로가 없으면 물을 가로지르는 직선을 반환하지 않는다. `tests/waterways.mjs`와 `tests/camera.cjs`가 실제 앱의 다리 보행 속도·높이·물 진입 방지·목적지 도착·취소, 물길 연결, 식생, 판자 클릭과 사방 렌더링을 확인한다.

2026-11-18: 로컬 구현과 전체 자동 검사 통과. 브라우저 확인은 Windows 화면 도구가 현재 주소를 확신할 수 없어 중단되어 실제 플레이 화면의 최종 육안 검토는 미완료다. GitHub/Pages에는 아직 게시하지 않았다. 기존 음악과 양 울음은 유지했다.


## Three.js 건물과 네 건물 출입 (2026-11-18)

`render/building-models.js`가 목동 집과 닭장의 실제 Three.js 메시를 생성한다. 집은 2층 발코니·굴뚝·창틀·덧문·화분, 닭장은 열린 문·판벽·환기구·뒤쪽 둥지 상자를 갖는다. 정적인 부품을 재질별로 합쳐 외관당 11~12개의 메시로 그린다. Three.js 0.180.0과 MIT 라이선스는 `dist/vendor/three/`에 포함한다. 버전 갱신 시 `npm ci` 후 `npm run vendor:three`로 다시 복사한다.

`render/buildings-three.js`는 WebGL 문맥 하나를 공유하고 기존 카메라의 위치·회전·초점·화면 중심을 그대로 Three.js 카메라에 옮긴다. 각 건물을 투명 캔버스에 그려 기존 깊이 정렬 순서에 합성하므로 가까운 동물을 건물이 무조건 덮지 않는다. 화면에 보이는 영역만 그리고, 정지한 시점의 그림을 재사용한다. 해상도 비율은 최대 1.5, 렌더링 면적은 약 180만 픽셀로 제한한다. WebGL을 사용할 수 없으면 동일한 Three.js 메시를 Canvas로 투영해 표시한다. 별도 프레임 루프는 만들지 않는다.

현재 출입 가능한 건물은 양 축사, 목동 집(1·2층), 닭장, 창고다. 닭장과 창고는 `game/farm-room.js`의 `FarmRoomVisit`가 맡는다. 건물 클릭과 둘러보기 버튼은 `dryRoute`로 문까지 걷게 하고, 도착한 뒤에만 실내 좌표로 전환한다. 실내는 `BarnInteriorView`를 사용하는 눈높이 시점이며 벽·천장이 닫혀 있다. 닭장에는 둥지·횃대·먹이통과 실제로 안에서 쉬는 닭을, 창고에는 건초·상자·도구 선반을 표시한다. 바닥 클릭·방향키로 걸을 수 있고, 나가기 버튼은 문까지 걷게 한 후 같은 건물 밖으로 돌려보낸다. 진행 중인 출입은 다른 이동·돌봄으로 취소된다. 창고 출입 위치는 원래 화면의 문 (24,48)에 맞췄으며 건초 가져오기도 같은 위치를 사용한다.

PC는 건물 자체나 각 둘러보기 버튼을 누르고, 휴대폰은 메뉴의 양 축사·목동 숙소·닭장·창고 버튼을 사용한다. 기존 모바일 버튼 이동 방식을 그대로 확장하며 버튼을 복제하지 않는다. 실내에서는 다른 건물이나 야외 돌봄을 시작할 수 없고, 목동 대화는 먼저 밖으로 나와 접근하게 한다. 목동 집의 기존 1·2층 이동과 숙소 내 대화는 유지한다.

`npm test`에는 `tests/buildings-three.mjs`의 메시·카메라 일치·사방 클릭 영역·WebGL 대체 표시·그림 재사용·해상도 제한·실내 벽·연속 출입 검사가 포함된다. 실제 브라우저 검사는 로컬 미리보기를 실행한 뒤 `npm run test:buildings:browser`로 수행한다. Playwright Core는 검사 전용 의존성이며 별도 검사 브라우저만 연다. 설치된 Chrome을 찾지 못하면 `BROWSER_EXECUTABLE`로 실행 파일을 지정한다. PC 1440×900, 휴대폰 390×844에서 Three.js GPU 표시, 건물 클릭/메뉴, 닭장·창고 입장·실내 보행·퇴장과 기존 축사·숙소 출입을 검증한다. 검사 화면은 게시 대상이 아닌 `.sites-runtime/buildings-qa/`에 저장한다. 게임 파일에는 검사 전용 상태 접근 코드를 넣지 않는다.

이번 변경은 로컬에 적용했으며 GitHub/Pages에는 아직 게시하지 않았다.


## 목동 집 눈높이 체험 (2026-11-18)

목동 집 내부의 위에서 내려다보는 시점을 폐기했다. `game/lodge-camera.js`의 `LodgeInteriorView`는 방문자의 현재 발 위치에 카메라를 두고 눈높이를 1.65로 고정한다. 확대해도 시야각만 바뀌며 카메라가 집 밖으로 물러나지 않는다. 드래그는 제자리에서 고개를 돌리고 위아래를 보는 동작이다. 실내에서는 자기 아바타를 그리지 않는다. 바닥 클릭은 눈높이 카메라와 같은 역투영을 쓰고, 방향키를 놓으면 바로 멈춘다.

`render/lodge-room-model.js`가 따뜻한 벽과 닫힌 천장, 들보, 침대·매트리스·베개·담요, 식탁·찻잔·책, 세면대, 책장, 난로·연통, 강아지 침구, 조명, 계단을 그린다. 2층에는 독서 벤치·작은 탁자·목장 일지·수납장과 발코니 망원경이 있다. 벽을 칸으로 나눠 실제 창문 구멍을 만들고 창틀·커튼을 별도로 배치한다. 창문 뒤로는 기존 목장 장면을 같은 눈 위치·방향·시야각으로 그리므로 실제 풍경이 보인다. 2층 창밖 시점은 4.2 높이를 더하며, 발코니 문을 지나 난간 앞까지 걸어갈 수 있다.

`game/lodge-layout.js`가 가구 자리와 보행 여유, 계단 구멍, 발코니 난간과 중앙 출입구를 관리한다. 클릭 이동은 가구를 피하는 경로를 쓰고, 직접 이동은 가구와 벽을 통과하지 않고 옆으로 미끄러질 수 있다. 계단 버튼은 기존처럼 계단 앞까지 걸어간 후 층을 바꾼다. 난간을 넘어 땅으로 내려가지는 않는다. 실내 목동 대화는 이전 이동 경로를 끝내고 가까이 접근한 뒤 눈길을 목동에게 맞춘다. 외관·양 축사·닭장·창고와 기존 돌봄은 보존했다.

`tests/lodge-immersive.mjs`는 실제 메시로 천장·벽·바닥을 쏘아 확인하고 열린 창문, 침대 충돌, 계단·발코니 경로, 눈높이와 바닥 역투영, 2층 높이를 검사한다. `tests/buildings-browser.cjs`는 PC 1440×900과 휴대폰 390×844에서 집 내부 입장·실제 드래그·보행·키 해제 정지·천장 보기·발코니·퇴장과 실내 대화를 확인하며 `.sites-runtime/buildings-qa/*-lodge-*.png`에 실제 화면을 저장한다. 현재 변경은 로컬에 반영했으며 온라인에는 아직 게시하지 않았다.


## 건물 뒤 동물의 가림 (2026-11-18)

기존에는 건물 입구의 한 점과 동물 발 위치로 전체 그림의 앞뒤를 정했다. 긴 벽의 옆·뒤쪽에서 보면 이 순서가 틀릴 수 있어 건물 뒤의 양이 벽 위에 보였다. `render/occlusion.js`의 `BuildingOcclusion`이 실제 벽·지붕 면을 카메라에 투영하고 픽셀별 가장 가까운 표면 거리를 저장한다. 역거리로 보간해 원근이 맞으며, 동물 그림은 해당 거리보다 뒤에 있는 픽셀만 잘라낸다. 양 전체의 투명도를 바꾸거나 사각형 범위 전체를 숨기지 않는다. 모서리 밖으로 나온 부분과 열린 출입문으로 실제 보이는 부분은 남는다.

`render/buildings-three.js`는 양 축사·목동 집·닭장의 실제 메시 면을 제공한다. 외관 카메라가 벽 안쪽에 잠시 놓이더라도 불투명 벽이 사라지지 않게 Three.js 외관 재질은 양면으로 그린다. `app.js`의 `paintWorldLayers`는 단단한 건물을 먼저 그리고, 양·방문자·목동·개·닭과 다른 세계 그림에 같은 가림을 적용한다. 교감 중 마지막에 그리는 양·방문자와 손도 벽의 가림을 우회하지 않는다. 벽에 완전히 가려진 위치의 동물 클릭과 교감 표시는 막는다.

건물 레이어의 building 값은 barn/coop/lodge/shed 식별자다. 해당 장면에 실제로 그리는 건물만 거리 계산에 넣는다. 특히 집 창밖 풍경에서는 자기 집 외관을 다시 그리지 않으므로 자기 집 외관으로 창밖 양·나무를 가리지 않는다. 실제 창문 구멍의 풍경은 기존 실내 메시와 합성한다.

거리 지도는 카메라·화면 크기·건물 메시가 바뀔 때만 다시 만든다. 고정 시점에서 동물이 움직여도 건물 면 전체를 매번 계산하지 않는다. 최대 약 150만 셀의 Float32 버퍼를 쓰며, 동물 그림과 겹치는 구역만 검사한다. 검사 결과는 겹치지 않는 가림 영역으로 합쳐 Canvas clip에 적용하므로 겹친 벽 면 때문에 구멍이 생기지 않는다.

`tests/occlusion.mjs`가 앞·뒤·부분 가림, 겹친 면의 합집합, 기울어진 벽의 원근, 실제 개구부, 가까운 면 잘라내기, 캐시와 메모리 한도를 검사한다. `npm run test:occlusion:browser`는 별도 브라우저에서 PC 1280×800·휴대폰 390×844의 실제 화면 PNG를 비교해 네 건물의 사방, 건물 앞·벽 뒤·모서리 양과 열린 축사 문을 확인한다. 교감처럼 마지막에 그리는 양도 동일하게 확인한다. 이 선택 검사는 Playwright Core와 Python Pillow를 사용하고 `.sites-runtime/occlusion-qa/`에 화면을 저장한다. 게임에는 검사 전용 접근 코드를 넣지 않는다. 기존 건물·실내·돌봄 브라우저 검사와 전체 자동 검사도 유지한다. 이번 변경은 로컬에 반영했다.


## 건물 사이 가림과 실제 벽 충돌 (2026-11-18)

`game/building-collision.js`는 축사·닭장·목동 집·창고의 지면 점유 범위를 관리한다. 성체·새끼 양은 실제 size에 따른 몸 반경을, 개·닭·사람은 각자의 여유 폭을 사용한다. `keepDry`가 물과 건물 양쪽을 피하게 하고, `navigation.js`는 같은 벽 모서리를 우회하는 경로를 보행자 반경별로 캐시한다. `Flock.move`와 반려동물 이동도 이 경로를 사용하므로 양의 발만 벽 밖에 남거나 양털이 벽에 들어가는 접근을 막는다. 초기 개체도 렌더링 전에 건물 밖에 배치한다.

평소 배회에는 건물 전체를 장애물로 취급한다. 비·밤의 축사/닭장 이동, 목동·개의 귀가, 방문자의 건물 입장은 해당 건물 정면 문까지만 허용한다. 출입 허가가 있어도 옆벽·뒷벽은 열리지 않는다. 문에 도착한 뒤 기존 실내 좌표로 전환하며, 퇴장 시에는 같은 문에서 걸어 나온다. 돌봄·건초 접근도 같은 우회 경로를 쓰고, 별도로 움직이는 옷자락 장난은 벽에 막힌 접촉을 취소한다. 기존 쓰다듬기 팔 동작·소리·다리·실내 시점은 보존한다.

`BuildingOcclusion`의 기존 역거리 지도에 가장 가까운 건물 ID도 저장한다. 건물을 그릴 때 다른 건물이 차지한 픽셀을 잘라 실제 표면 거리대로 합성한다. 긴 벽을 입구 한 점으로 정렬하는 순서가 틀려도 앞 건물이 뒤 건물에 덮이지 않는다. 메시 밖으로 나가는 뒤 건물의 그림자도 앞 지붕·벽에 덧그려지지 않게 한다. 동물의 불투명도는 유지하고 실제 열린 문·모서리의 부분 가림도 보존한다. 고정 카메라에서는 가림 영역을 재사용한다.

`tests/building-collision.mjs`는 네 건물, 성체·새끼 몸 크기, 안전한 초기 배치, 문 접근, 옆·뒷벽, 정상 속도 우회와 실제 Flock 이동을 확인한다. 기존 밤·비 입퇴장 검사도 유지한다. `tests/occlusion.mjs`는 서로 기울어진 두 벽의 앞뒤가 화면 위치에 따라 바뀌는 경우와 뒤 건물 그림자를 검사한다. 로컬 미리보기에서 `npm run test:walls:browser`는 PC·휴대폰 크기에서 실제 건물을 역순으로 그린 PNG를 비교하고, 실제 양이 닭장을 돌아가는 연속 위치·속도·도착을 검증한다. 화면은 `.sites-runtime/wall-qa/`에 저장하며 게임 코드에 검사 훅은 포함하지 않는다. 변경은 로컬 적용이다.

검증 결과: 전체 `npm test` 통과, PC 1440×900·휴대폰 390×844의 기존 건물 출입 브라우저 검사 통과, PC 1280×800·휴대폰 390×844의 건물 역순 합성 PNG 비교와 양의 닭장 우회 브라우저 검사 통과. 가장 큰 양이 축사·닭장 사이의 좁은 통로에 들어갈 수 없는 경우도 두 건물 밖의 유효한 위치로 처리하며 반복 밀어내기로 벽 안에 남지 않는다. 로컬 미리보기의 최신 index와 연결된 53개 JS 모듈 응답을 확인했다. 최종 캐시 버전은 solid-buildings-2다.


## 양·건물·빈 공간의 클릭 구분 (2026-11-18)

`tapWorld`가 건물 전체를 감싸는 사각형을 양보다 먼저 검사하던 부분을 수정했다. 야외에서는 화면에 보이고 벽에 가려지지 않은 양·목동을 먼저 선택한다. 양 선택은 기존 쓰다듬기·우유 접근으로 이어지고, 건물 뒤 양은 기존 픽셀 거리 판정으로 선택을 막는다. 실내 클릭·입장 버튼·모바일 메뉴 동작은 유지한다.

동물 선택이 없는 경우 `BuildingOcclusion.buildingAt(x,y)`가 합성에 쓰는 가장 가까운 건물 ID를 그대로 조회한다. 실제 벽·지붕·문짝·바닥이 있는 픽셀만 해당 건물 입장을 시작한다. 건물 사각형 안에 있더라도 빈 하늘·풀밭·출입문 너머의 빈 공간은 건물로 선택되지 않는다. 열린 구멍 뒤 다른 건물이 실제로 보이면 그 건물이 선택된다. 별도의 Raycaster나 매 프레임 이미지 읽기는 추가하지 않고 기존 거리·ID 버퍼를 재사용한다.

`tests/camera.cjs`는 실제 pointerdown/up 처리에 벽 앞 양·벽 뒤 양·기존 사각형 안의 풀밭을 넣어 교감·입장·걷기 우선순위를 확인한다. `tests/occlusion.mjs`는 표면·개구부·하늘·풀밭과 큰 화면의 CSS 좌표를 검사한다. `npm run test:picking:browser`는 실제 Blender 축사가 로딩된 PC 1280×800·휴대폰 390×844(2배 픽셀 비율)에서 340% 확대 마우스/터치 선택, 실제 쓰다듬기 시작, 건물에서 바깥을 바라보는 빈 풀밭 이동, 벽 뒤 양의 선택 차단과 네 건물의 보이는 표면 입장을 검사한다. 확인 화면은 `.sites-runtime/picking-qa/`에 저장하고 테스트 상태 접근은 브라우저의 검사 전용 소스에만 넣는다. 게임 코드에 검사 훅은 포함하지 않는다. 로컬 수정이며 공개 배포는 하지 않았다.

검증 결과: 전체 `npm test`, PC·휴대폰의 `npm run test:picking:browser` 모두 통과. 340% 상태의 앞 양 선택→쓰다듬기, 빈 풀밭 보행, 바깥을 바라본 시점의 오입장 방지, 벽 뒤 양 차단, 네 건물의 표면 클릭 입장을 확인했다. 로컬 최신 index와 연결된 53개 JS 모듈의 정상 응답도 확인했다. 캐시 버전은 visible-picking-1이다.

## 양 축사 Three.js 전환 (2026-11-19)

`render/building-models.js`의 `createBarnModel()`이 양 축사 외관을 목동 집·닭장과 같은 재질, 조명, 지붕 눈 표현을 쓰는 Three.js 메시로 만든다. 앞문은 기존 출입 좌표를 중심으로 폭 6.2를 열어 두고, 양쪽 벽은 `game/building-collision.js`의 축사 영역(좌우 9.65, 앞 0, 뒤 18)에 맞춘다. `createBarnRoomModel()`은 닫힌 바닥·벽·천장과 양 울타리·창문·보를 실내 눈높이 시점에 그린다. 기존 Blender 메시 파일과 렌더러는 남아 있지만 현재 게임에서 사용하지 않는다.

`render/buildings-three.js`가 축사·집·닭장 외관과 축사 실내를 한 WebGL 문맥에서 그린다. WebGL을 사용할 수 없으면 같은 메시를 Canvas에 투영한다. 외관의 실제 메시 면을 화면 가림과 클릭 판정에도 사용한다. 겹친 건물의 표지판은 건물 메시를 모두 그린 후 고정된 순서로 그려 모바일에서도 그리기 순서에 따라 달라지지 않는다. 기존 문 출입, 양의 축사 이동, 몸 크기별 벽 충돌과 실내 이동 범위는 유지한다. 캐시 버전은 `barn-three-2`이다.


## 이용자가 고르는 목장 시간 (2026-11-19)

`game/meadow-time.js`의 MeadowTime이 실제 접속 시각과 독립된 개인 시간을 관리한다. 새 방문자는 낮 12:00으로 시작하고, 메뉴의 시간·날씨에서 아침 07:00·낮 12:00·노을 18:00·밤 22:00을 고르거나 00:00~23:59의 원하는 시각을 직접 적용한다. 선택한 시각에 머물며 자동으로 밤으로 넘어가지 않는다. `meadow.time.v1`의 분 단위 값을 각 이용자의 브라우저에 저장하고, 저장 제한·잘못된 데이터가 있어도 기본 낮으로 플레이할 수 있다.

실제 지역 날씨와 시간 선택을 분리했다. 날씨의 종류·강수·연결 상태는 기존대로 유지하고, 시간·밤·노을만 개인 선택으로 덮어쓴다. 지역 변경·해제나 감상용 날씨 변경도 선택한 시각을 지우지 않는다. 날씨 API의 일출·일몰이나 기기의 밤 시간이 개인 목장 시간을 바꾸지 않는다. 임시 testDay 고정과 '(테스트)' 표시는 제거했다.

선택한 밤에는 기존 개의 몰이·축사와 닭장 입장·목동과 개의 귀가가 동작한다. 이용자가 낮으로 바꾸면 맑은 날의 자동 귀가는 20초 대기 없이 해제되어 동물들이 원래의 문과 실내 동선을 따라 차례로 나온다. 비·눈이나 이용자의 직접 동물 모으기는 우선한다. 동물을 순간 이동시키거나 축사의 벽 충돌을 우회하지 않는다.

시간 선택은 기존 목장 설정 패널의 첫 섹션이며 PC는 시간·날씨 버튼, 휴대폰은 메뉴 → 시간·날씨로 접근한다. 선택된 버튼의 aria-pressed와 배경 대비, 직접 시각 입력과 적용 버튼, 저장 안내를 제공한다. UI의 날씨 안내와 조작 도움말도 개인 시간 선택에 맞췄다.

검증: `tests/meadow-time.mjs`의 새벽 방문·분 단위 선택·시간대 경계·저장 복원·독립된 이용자·손상/제한 저장·날씨 분리, `tests/camera.cjs`의 실제 앱 밤→낮·강수·직접 모으기 우선순위와 전체 `npm test` 통과. PC와 390×844 휴대폰 크기의 실제 브라우저에서 밤/노을 표시, 문을 통한 귀가·외출, 09:35 직접 입력, 새로고침 후 시간 유지, 메뉴 접근과 선택 표시를 확인했다. 확인 화면은 별도 작업 공간에 저장했고 게임에는 검사 훅을 넣지 않았다. 공개 반영은 GitHub Pages 배포 기록을 따른다. 캐시 버전은 chosen-time-2다.

## P09 풍차 전망대와 완공 안내 (2026-11-19)

기준 커밋은 main의 45fbaa2다. X -57.3, Z -41에서 Three.js 풍차를 실제 시간으로 열흘 동안 짓는다. 한국 시간 2026년 11월 29일 오후 7시 33분 49초에 날개가 돌기 시작하며 전망 발코니가 열린다. 축사 높이의 세 배인 지붕과 높이 15.8의 발코니를 사용한다.

게임의 풍차 전망대 버튼이나 현장을 누르면 현재 공정, 완공 예정일과 남은 기간이 보인다. 하루 미만이면 시간과 분을 표시한다. 공정과 카운트다운은 같은 완공 시각을 사용한다. 검사 명령은 `npm test`와 `node tests/windmill-browser.cjs`이며 브라우저 검사는 PREVIEW_URL로 지정한 미리보기에서 실행한다.

## 공개 게임의 AI 목동 (2026-11-19)

원격 main의 c45e78b를 기준으로 GitHub Pages의 대화창을 기존 공개 목동 서버에 연결했다. 로컬과 Sites에서는 같은 출처의 API를 사용한다. Sites 서버는 GitHub Pages 출처의 상태 조회, 대화 전송과 브라우저 사전 요청을 지원한다. 기존 서버 비밀 설정과 요청 횟수 제한을 사용한다. 변경 파일은 dist/shepherd-chat.js, 앱과 페이지의 모듈 버전, server/shepherd-api.js, tests/shepherd-chat.mjs 및 README.md다.

전체 npm test를 통과했다. 배포된 Sites 서버에서 GitHub 출처로 상태 조회 200, AI 활성 표시, 사전 요청 204를 확인했다.

## 연못가 풀숲과 계절 둥지 (2026-11-19)

GitHub main의 풍차 커밋 c45e78b를 기준으로 연못가 세 곳에 풀숲을 넓히고 새 둥지를 배치했다. dist/render/pond.js에서 풀과 둥지를 그리고, dist/pasture.js에서 달을 전달해 3월부터 6월까지 알 세 개가 보이도록 했다. 전체 npm test 통과. PC 1280×800과 휴대폰 390×844에서 목장 입장 후 연못 장면 렌더링을 확인했다. 공개 반영은 해당 커밋의 GitHub Pages 배포 기록을 따른다.

공개 게임에서 `?start=lakeshore`로 입장하면 새 둥지가 있는 연못가에서 시작한다. 기존 방문자도 새 풀숲을 볼 수 있게 관련 게임 파일의 캐시 버전을 갱신했다.

## 연못과 개울 합류부 물색 (2026-11-19)

main 43c32b9에서 연못 위로 튀어나오던 사각형 물 조각을 제거했다. 양쪽 둑과 얕은 물부터 그린 뒤 개울과 연못의 깊은 물을 이어 그리고 낮·노을·밤에 두 물길이 같은 물색을 사용한다. 관련 파일은 render/pond.js, render/waterways.js, pasture.js, 앱·페이지 모듈 버전과 waterways 검사다.

전체 npm test 통과. Chrome 940×755 및 390×844에서 두 물길과 연못이 이어지고 사각형 조각이 사라진 것을 확인했다.

## 2026-11-19 — 목장을 가로지르는 연두색 띠 제거

main 7325ead 기준. `dist/pasture.js`에서 지형을 무시하고 목장 끝까지 이어지던 장식용 사각형을 삭제하고 앱과 입장 페이지의 캐시 버전을 갱신했다. 전체 npm test 통과. 연못가 시점에서 PC·휴대폰 크기 각각 72개 회전 각도를 비교해 수정 전 21개 각도에서 그려지던 띠가 수정 후 0개임을 확인했다.

## 하루의 입장 안내와 질문 수첩 (2026-11-19)

원격 main 7325ead 기준. 기존 시작 화면을 반투명 안내 하나로 통합했다. 브라우저별 안내 설정은 도움말에서 변경한다. 방문자 화면은 GitHub Pages, 목동 대화와 운영자 수첩은 기존 Sites 서버를 사용한다. 운영자는 Sites의 /notebook.html 에서 본인 계정으로 로그인해 질문에 답하거나 목장 일지를 예정·관찰로 구분해 작성한다. HARU_OPERATOR_EMAIL은 서버에서만 설정한다. 질문 ID별 중복 제출을 방지하고 수첩에는 요지와 횟수를 남긴다. 풍차 공정, 계절 둥지, 개인 시간과 양은 질문 시점에 계산한다.

로컬 전체 npm test와 Chrome 320·390·1280px에서 안내 선택 저장·다시 켜기를 확인했다. 독립 브라우저 두 개와 운영자 화면을 사용해 미확인 질문 저장, 답 등록, 바꿔 묻기에 대한 실제 AI 매칭을 확인했다. 브라우저 시험은 별도 미리보기 DB를 사용하며 공개 수첩에 예시 질문을 추가하지 않는다.

## 2026-11-19 — 풍차 옆 P10으로 해먹 이동

main 74fb5e1 기준. 해먹의 중심과 휴식 목적지를 공통 설정 `dist/game/config.js`의 X -46.7, Z -46.9로 옮겼다. `dist/app.js`, `dist/index.html`에서 새 설정을 불러오도록 버전을 갱신하고 `tests/camera.cjs`에서 길어진 보행 시간을 반영했다. 전체 npm test 통과. Chrome 940×755 및 390×844에서 풍차 앞에서 휴식 버튼을 눌러 새 좌표까지 걸어가 눕고 다시 일어나는 동작을 확인했다.

## 2026-11-19 — 목동 하루의 대화 말투

3585939 기준. 첫 만남과 잡담, 날씨와 동물 안내, 풍차와 계절 둥지, 모르는 질문과 오프라인 응답에 하루의 편안한 해요체를 적용했다. 잡담에서는 직전 답변을 참고해 같은 인사를 반복하지 않는다. 수첩에 운영자가 가르친 답과 공사 일정·실제 마릿수는 기존 자료에서 읽는다.

## 2026-11-20 — 여러 창의 공통 지침 동기화

`main` 기준 `dc65202`. 루트 `AGENTS.md`에 버그 기록 사전 검토와 지침 변경 담당자의 GitHub 반영·재확인 절차를 추가했다. 동시에 수정된 지침은 최신 원격 내용과 합치고 커밋을 확인한다. 대상은 공통 지침과 이 기록이다.
