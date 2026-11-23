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

양 울음은 목장의 녹음 파일 세 가지를 사용하며, 가까운 양의 위치와 거리에 맞춰 재생한다.
물고기나 젖소는 추가하지 않았습니다. 양 50마리와 새끼 12마리, 닭 10마리, 개 2마리입니다.
양 축사·목동 집·닭장 외관과 출입 가능한 실내는 Three.js 입체 모델입니다. 동물과 배경은 기존 일러스트 표현을 유지합니다.
배경음악은 사용자가 제공한 Pastoral Loop.mp3를 사용합니다.

옷 당기기는 교감 확대를 사용하지 않습니다. 양이 옷 끝까지 접근한 뒤 짧은 옷 주름만 그립니다. 입과 옷자락 간격은 `tests/tug.mjs`가 여러 카메라 각도에서 검증합니다. 긴 연결선이나 팔 올리기 동작을 추가하지 마세요.

우유주기는 `render/milk-pose.js`의 고정 길이 팔과 무릎 굽힌 전용 자세를 사용합니다. 서 있는 어깨에서 새끼 입까지 연결선을 그리지 않습니다. 양 옆 0.82 거리의 마른 지점에 도착한 뒤 시작하며 `tests/milk-pose.mjs`가 자세와 거리를 검증합니다.

보행 관절은 `game/gait.js`에서 계산합니다. 무릎은 진행 방향의 수직 평면에서만 굽히고, 정면/뒷모습의 다리 가로 위치는 고정합니다. `tests/gait.mjs`는 뼈 길이, 무릎 굽힘 방향, 발 교대, 디딤발과 발 들기를 검증합니다. 우유 주기의 무릎 굽힌 자세는 별도 모듈이라 영향을 받지 않습니다.

교감 예약과 실제 접촉은 다릅니다. `careContact`는 다가가기를 완료하고 손길/젖병 동작이 시작될 때만 true로 설정합니다. 눈 감기·볼 표현은 이 값에 따르고, 취소와 완료는 unlock에서 해제합니다. `tests/contact-eyes.mjs`가 실제 양 렌더러의 접근/접촉/종료 표현을 검증합니다.

배경음악은 사용자가 제공한 MP3를 반복 재생한다.

배경음악은 dist/assets/sounds/pastoral-loop.mp3이며 한 개의 오디오 요소로 스트리밍한다. 게임 내 배경음악의 기본 음량은 50%다.

간소한 UI는 너비 700px 이하 **또는 높이 540px 이하**에서 사용합니다. `game/layout.js`의 COMPACT_UI_QUERY와 style.css의 미디어 쿼리를 함께 유지하세요. 폰 가로 회전은 너비가 커져도 높이가 낮으므로 PC 메뉴로 바뀌지 않습니다. tests/layout.mjs가 양쪽 기준과 대표 가로/세로 크기를 검증합니다.

안내문을 띄울 때 배경음악과 양 울음 재생을 시도한다. 자동재생이 제한된 기기는 안내문에서 첫 터치로 소리를 켜고 계속 안내를 읽을 수 있다. 안내 생략으로 입장할 때도 같은 순서를 사용한다.

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

## 2026-11-20 — 닫힌 문을 열고 입장

요청은 방문자가 닫힌 문을 통과해 보이던 문제다. 기준은 main f4f0832다. 숙소 외관의 막힌 벽에 입구 깊이를 만들고 문짝·손잡이·빗장을 같은 경첩으로 회전시켰다. 창고는 벽을 따라 문짝을 민다. 출입 시 이동은 열린 문턱을 통과하고, 방문자가 나와 입구에서 멀어진 뒤 문이 닫힌다. 축사와 닭장은 평소부터 열린 출입구를 쓴다. 풍차는 별도의 전망 화면이다.

앱과 외관 모델·렌더러, 출입·모델 검사, 재발 기록을 갱신했다. 실제 브라우저의 1000×700, 390×760에서 두 문의 닫힘·중간·열림 영상 프레임 차이를 확인했다. 800×500에서는 WebGL을 끄고 같은 검사를 통과했다. 출입 검사는 방문자가 문 앞에서 기다리고 열린 뒤 입장하는 순서, 퇴장 후 거리별 닫힘을 검증한다.

## 2026-11-20 — 목동 숙소 계단 앞 난로 이전

기준은 main 235f5e8이다. 1층 계단 정면의 난로를 입구에서 오른쪽 벽 쪽으로 옮기고 불창을 방 안으로 돌렸다. lodge-layout과 lodge-room-model이 하나의 난로 위치와 받침대 크기를 사용하도록 바꾸고 앱에서 새 모듈을 불러오도록 했다. 계단 앞 직선 보행, 받침대의 실제 크기와 충돌 범위 일치, 왕복 중 카메라와 캐릭터 사이의 난로 간섭을 lodge-immersive 검사에 추가했다. Chromium 1280×720과 390×760에서 왕복하며 진입·중간 단·도착 장면이 그려지는 것을 확인했다.

## 2026-11-21 — 방문자 아바타 ‘내 모습’
- 기준은 GitHub `main`의 `54dc221`이다. 기본 밀짚모자 차림으로 입장하고 PC 상단 또는 휴대폰 메뉴에서 네 차림과 머리색·옷 색을 고른다. 적용한 차림은 같은 브라우저에 저장한다.
- 외형 데이터는 `dist/game/visitor-appearance.js`, 화면은 `dist/avatar-panel.js`, 공통 그림은 `dist/render/visitor-look.js`에서 관리한다. 실내외 방문자·무릎 꿇기·양과의 교감·해먹에서 같은 선택을 쓴다.
- 게임 회귀 검사와 네 방향 렌더링을 확인했다. 브라우저에서 차림과 색을 바꾼 후 다시 입장해 선택이 유지되는 것을 확인했다. 390×760 화면에서는 메뉴를 통해 열고, 미리 본 변경을 취소하면 기존 차림이 유지되는 것도 확인했다.

## 2026-11-21 — 입장 안내에서 목장 소리 시작
- 기준은 main의 fc877fa다. dist/app.js의 안내 표시와 소리 시작을 연결하고 dist/game/audio.js에서 대기 중인 자동재생을 첫 조작으로 다시 시작하도록 했다. dist/index.html과 스타일에 안내를 닫지 않는 소리 버튼을 추가했다.
- tests/audio.mjs에서 지연된 자동재생과 터치 재시도의 경합을 검사한다. 390×760 브라우저에서 안내가 열린 채 MP3 재생 시간이 증가하고 양 울음이 재생됐으며, 산책을 시작한 뒤에도 음악이 이어졌다.

## 2026-11-21 — 입장 안내에서 목장 소리 시작
- 기준은 main의 fc877fa다. dist/app.js의 안내 표시와 소리 시작을 연결하고 dist/game/audio.js에서 대기 중인 자동재생을 첫 조작으로 다시 시작하도록 했다. dist/index.html과 스타일에 안내를 닫지 않는 소리 버튼을 추가했다.
- tests/audio.mjs에서 지연된 자동재생과 터치 재시도의 경합을 검사한다. 390×760 브라우저에서 안내가 열린 채 MP3 재생 시간이 증가하고 양 울음이 재생됐으며, 산책을 시작한 뒤에도 음악이 이어졌다.

## 2026-11-21 — 첫 안내문 배경음악 기본 음량 50%
- main의 e1944ad 기준. 11월 20일에 22%에서 45%로 올린 배경음악을 50%로 조정했다. 첫 안내문에서 곧바로 재생을 시도하고, 브라우저가 차단하면 첫 터치에서 이어지는 기존 동작을 유지한다. tests/audio.mjs에서 음량과 재생 시작 조건을 검사한다.

## 2026-11-21 — 안내문에서 배경음악과 양 울음을 독립적으로 시작
- 기준은 main의 00f3fc1이다. dist/game/audio.js에서 두 소리가 서로의 재생 허가를 기다리지 않게 하고, 첫 시도부터 울음 파일을 준비한다. 음악은 50%로 재생한다.
- dist/app.js는 울음이 준비되는 즉시 가까운 양에게 첫 울음을 맡긴다. 첫 터치로 소리를 켜도 안내문은 열린 상태를 유지한다. tests/audio.mjs에 음악만 허용되는 경우와 양 울음만 허용되는 경우를 추가했다.

## 2026-11-21 — 닭장 회전 중 캐릭터 상하 흔들림 수정
- main 85113ca 기준. 닭장에서는 문과 통로 모서리까지 확보한 거리로 회전 반경을 정해 제자리에서 방향을 돌려도 캐릭터 크기와 화면 높이가 일정하다. 앱과 카메라 모듈의 캐시 버전을 갱신했다.
- tests/buildings-three.mjs에서 모바일 세로·PC 크기로 네 위치에서 360도를 검사하고 tests/doorway-walk.mjs로 실내 문과 이동을 확인했다. 카카오톡 실기기 확인은 남아 있다.

## 2026-11-21 — 닭장 문 앞에서 발이 잔디 위로 이동해 보이던 현상
- main 3246750에서 재현. 실내 발 위치를 화면 아래로 제한하면서 문턱 밖에 그려졌다. 닭장에서는 바닥 윗면과 같은 위치에 발과 그림자를 투영하고, 좁은 곳에서는 카메라의 거리·기울기·초점거리로 인물을 담는다. 문밖 풍경에도 같은 렌즈를 쓴다.
- 검사는 tests/buildings-three.mjs의 회전·접지·확대 검사와 tests/doorway-walk.mjs의 출입 검사로 유지한다.

## 2026-11-21 — 닭장 안의 과도한 광각 원근 수정
- dabb522 기준. 입구에서 짧은 회전 반경에 초점거리를 맞추면서 수평 화각이 140도를 넘었다. 닭장 렌즈를 회전 반경과 분리하고 문틀·창틀의 원근과 문밖 지평선을 맞췄다. 카메라 거리와 높이로 발의 접지점을 유지한다.
- tests/buildings-three.mjs에서 휴대폰 세로·가로와 PC의 화각, 문틀 위·아래 배율, 360도 회전 시 발 위치를 함께 검사한다. tests/doorway-walk.mjs로 실내 바닥 클릭과 문 통과를 확인한다.

## 2026-11-21 — 닭장에서 제자리 회전할 때 배경이 당겨지는 현상
- main 37326f8에서 입구의 카메라 반경이 회전 방향에 따라 약 0.65~4.67로 변했다. 닭장 바닥에서 한 바퀴 전체에 필요한 여유 거리로 원형 궤도를 정한다. 제자리 수평 회전은 반경·눈높이·렌즈 배율에 영향을 주지 않는다.
- tests/buildings-three.mjs에서 입구·통로·벽 가까이에서 양방향으로 돌아 반경과 눈높이, 같은 거리에 놓인 기준 물체의 배율을 검사한다. 화각·두 발 접지·건물 출입 검사도 함께 실행한다.

## 2026-11-21 — 아바타 양손과 팔다리 음영
- main 2005bae 기준. 한쪽 소매에 빠졌던 손을 그렸다. 각 소매와 바짓단을 같은 옷감으로 표현하고 화면 왼쪽 위 빛을 기준으로 관절마다 둥근 음영을 준다.
- 미리보기와 목장, 무릎 꿇기·먹이 주기·쓰다듬기·해먹 포즈에 공유한다. tests/visitor-appearance.mjs에서 앞·뒤 양손과 양쪽 다리의 명암을 검사한다.

## 2026-11-21 — 동쪽 전나무 숲과 야생동물
- main ac2280e에서 분리한 작업 사본 기준. 지도에 표시된 P14→P12→P11→P13 위치를 기존 P09와 경계에 맞춰 근사했다. 숲과 흙길은 외부 목장과 같은 좌표계에 있고 카메라 회전·이동을 공유한다.
- 창고 동쪽을 걸어서 방문하거나 `?start=forest`로 시작한다. 침엽수 줄기와 바늘잎, 고사리, 얼룩 햇빛을 그린다. 산토끼 두 마리와 고라니 한 마리가 지면에서 움직인다. 젖은 날과 밤에는 바닥의 햇빛을 줄인다.
- tests/fir-grove.mjs가 네 지점, 물을 피하는 접근, 나무줄기 우회 및 야생동물 통과 폭을 검사한다. 숲 안 시야는 PC와 모바일 세로 해상도, 회전한 방향으로 렌더링해 확인했다.

## 2026-11-21 — 현재 위치를 보는 목장 지도와 도보 길 찾기
- main 1d39aff에서 분리해 작업. PC·휴대폰의 ‘지도 보기’에서 땅이나 장소 이름을 누르면 기존 물가·다리·건물·숲 경로를 따라 걷는다. 실내는 먼저 문으로 나오고 숙소 2층은 계단을 이용한다.
- 지도 지형은 공통 목장 좌표에서 생성한다. 이동 중 지도를 다시 열면 현재 위치와 남은 도보 경로를 표시한다. 건물 선택은 문 앞, 물 선택은 가까운 물가를 목적지로 삼는다.
- tests/ranch-map.mjs는 추천 목적지와 다리 경유, tests/doorway-walk.mjs는 네 건물에서 지도 목적지까지 실제 이동을 검사한다.

## 2026-11-21 — 연못 나무다리의 꽃길
- GitHub main 9502b22 기준. dist/render/pond-garden.js에서 통나무다리 동쪽 끝과 초지를 굽은 흙길로 연결했다. 꽃 무리와 물가 돌·부들은 실제 지면 좌표에 배치하며 기존 물 마시는 자리와 건너편 둥지를 보존한다. 꽃과 돌 그림은 한 번 그려 재사용한다.
- dist/app.js에 지면·깊이순 장식과 정원 시작 위치를 연결했다. dist/index.html이 새 앱을 불러온다. 공개판에서 `?start=garden`으로 방문할 수 있다.
- tests/pond.mjs에서 다리 끝과 길의 연결 및 흙길 양쪽 가장자리의 연못·하천 침범을 검사한다. 전체 npm test 통과.

## 2026-11-21 — 연못 흙길을 잔디로 복원
- GitHub main 14ab122 기준. dist/render/pond-garden.js의 흙길과 자갈 무늬를 제거하고 들꽃을 물가 네 곳에 모았다. 돌과 부들은 이전 배치와 위치·크기가 같다. dist/app.js와 dist/index.html에 적용했으며 정원 바로가기는 같은 자리에서 시작한다.
- tests/pond.mjs는 물가 장식과 양들의 물 마시는 자리를 검사한다. 이전 버전과 돌·부들 좌표를 대조했다.

## 2026-11-21 — 연못 전체와 산자락 개울
- GitHub main fdc643c 기준. pond-garden.js에서 기존 돌·부들·들꽃을 살려 나머지 연안에 무리를 배치했다. 물 마시는 곳·새 둥지와 다리 양 끝에 여유를 남긴다. 유입 하천은 양쪽 강안에 간격을 둔 작은 무리를 둔다.
- game/waterways.js에서 기존 중심선과 다리 주변을 유지하고 상류 폭을 위치별로 부드럽게 바꾼다. 게임 화면·지도·물 충돌·도보 경로가 같은 하천 자료를 쓴다. 지도에서 ‘상류 물가’를 고르거나 `?start=upstream`으로 방문한다.
- tests/pond.mjs는 네 방향 장식과 개울의 상·중·하부 장식을, tests/waterways.mjs는 폭의 변화와 한쪽 강안을 따라 걷는 경로 및 다리 횡단을 검사한다.

## 2026-11-21 — 전나무 숲의 손그림 여우
- main 2936750 기준. 숲 바로가기 입구 앞에 김감독이 그린 여우 한 마리가 작은 타원을 따라 걷는다. dist/assets/forest-fox.webp에 배경을 투명하게 처리한 36개 동작을 담아 머리·네 다리·꼬리의 움직임과 색연필 선을 살렸다.
- game/fir-grove.js에서 마른 숲길 위 위치를 정하고 render/fir-grove.js에서 숲의 깊이 순서와 화면 기준 이동 방향에 맞춰 그린다. tests/fir-grove.mjs에서 여우 수, 활동 범위와 애니메이션을 확인한다. 전체 게임 검사 및 PC·휴대폰 크기에서 숲 입장 위치의 36프레임 투영 검사 통과.

## 2026-11-21 — 상류 자작나무숲
main 2111c50 기준. game/fir-grove.js에 전나무숲의 두 배 면적과 231개 줄기 충돌을 정의하고 render/fir-grove.js, app.js, ranch-map.js에 수피·들꽃 렌더링과 지도 목적지를 연결했다. 숲·지도 검사와 수면 배치를 확인했다. 로컬 브라우저의 소켓 제한으로 화면 검증은 대기 중이다.

## 2026-11-21 — 자작나무숲 하층 식생과 전나무 높이
main 16e55a6 기준. game/fir-grove.js와 render/fir-grove.js에서 전나무 높이를 기존의 1.5배로 늘리고 수관 가시 범위를 조정했다. 자작나무숲에는 기존 고사리와 새 관목·들꽃을 군락으로 배치했다. 나무별 높이 배율, 줄기 충돌, 두 화면 크기의 식생 투영과 마른 땅 배치 검사를 통과했다.

## 2026-11-21 — 자작나무숲 바닥 잡풀
main 934bfc5 기준. dist/render/fir-grove.js에 서로 겹치는 낮은 풀 포기를 추가했다. PC와 휴대폰 크기의 투영에서 풀 생성·그리기 및 물과 숲 경계를 검사했다.

## 2026-11-21 — 자작나무 흰 줄기 연장
main e9b4490 기준. dist/render/fir-grove.js에서 각 그림의 가장 낮은 가지와 뿌리 사이를 1.5배 연장하고 수관 높이에 맞춰 가림 범위를 조정했다. 화면 폭 390·1280에서 231그루의 줄기 배율과 뿌리 접지, 그림 경계의 연속성을 검사했다.

## 2026-11-21 — 두 숲의 언덕과 여우굴 파기
main 5f85d11 기준. 숲마다 완만한 언덕 세 개를 배치하고 야외 투영·카메라 높이·바닥 터치를 같은 지형에 연결했다. 비탈의 흙자리에서 여우굴 파기를 누르면 굴 입구가 생기고 브라우저에 저장된다. dist/game/forest-hills.js, dist/render/forest-hills.js, app.js, orbit.js와 숲 식생 및 안내를 수정했다. 96개 시점·화면 조합의 지형 터치 검사와 여우굴 생성·저장 검사를 수행했다.

## 2026-11-21 — 언덕 그리기 오류로 비어 보인 공개 목장 복구
main 98cb7bc. 공개 브라우저에서 drawHills의 faces 참조 오류 재현. 언덕별 mesh.faces를 사용하고 앱과 언덕 모듈의 캐시 주소를 갱신했다. 기본·전나무·자작나무 시작 좌표에서 두 화면 크기로 실제 지형 그리기 함수를 실행하는 회귀 검사를 추가했다.

## 2026-11-21 — 자연스럽게 흩어지는 자작나무 숲 가장자리
main 775212b 기준. 숲 네 방향의 윤곽과 밀도를 다르게 하고 물가를 피해 어린 나무 무리와 독립된 들꽃·고사리 군락을 배치했다. 잡풀은 나무와 다른 경계에서 서서히 작아지고 드물어진다. 모든 줄기의 접촉 판정과 두 화면 폭의 식생 그리기를 검사했다.

## 2026-11-23 — 배포 전 별도 조작 검수
- GitHub `main` 703f19d 기준. `AGENTS.md`에 플레이에 영향을 주는 변경의 공개 배포 전 별도 서브에이전트 검수 절차를 추가했다. 미리보기에서 직접 조작하고, 문제가 발견되면 수정한 뒤 같은 조건에서 다시 검수한다.
- 로컬 지침과 GitHub `main`의 68f5333에서 문구를 확인했다. 반영 범위는 문서다.

## 2026-11-23 — 목장역과 빨간 트램 시안

- GitHub main a0c3002 기준의 별도 작업 사본. 목장역 중심 X 66, Z 50에 목조 역과 서쪽 출입구를 두고, 나무 승강장과 빨간 트램을 추가했다. 선로는 P01인 X 89.3, Z 47.6부터 북쪽으로 휜다.
- dist/render/tram-station.js와 기존 Three.js 건물 렌더러가 지붕, 창틀, 행선판, 차륜, 레일을 그린다. 게임 지도에서 목장역을 골라 서쪽 출입구까지 걸어 접근한다. 역과 트램은 외부 충돌에 포함한다. 로컬 시작 옵션은 ?start=station이다.
- 전체 npm test 통과. 새 검사는 P01 통과, 차륜과 레일의 높이, 마른 도보 경로, PC와 휴대폰 세로·가로 좌표에서의 메쉬 투영을 확인한다. 모델로 별도 배치 이미지를 렌더링했다. 이번 작업은 로컬 외관과 정차 배치 시안이며 주행과 북극 노선은 후속 기능이다.


## 2026-11-23 — 리스본 트램 외관 보정

- GitHub main a0c3002 기준의 별도 작업 사본. 김감독이 보여준 리스본 트램 사진을 기준으로 dist/render/tram-station.js의 전면을 각진 곡면으로 바꾸고 키 큰 나무 창틀, 크림색 상부, 빨간 몸체, 금색 선, 둥근 전조등, 앞쪽 난간과 집전봉을 구현했다.
- 정차 차량은 외관 모델 단계다. 객실과 탑승은 구현 전이다. 전체 npm test 및 마지막 창틀 수정 후 트램의 PC·휴대폰 투영 검사를 통과했으며, Three.js 모델로 외관 비교용 이미지를 렌더링했다. 상태는 별도 로컬 시안이다.


## 2026-11-23 — 앞이 열린 간이역과 트램 객실

- GitHub main a0c3002 기준의 기존 별도 작업 사본. 참고 사진을 바탕으로 dist/render/tram-station.js에 깊은 골판 지붕, 삼면 판자 벽, 실내 벤치, 양 표지 그림과 둥근 바람목장역 간판을 구현했다.
- dist/game/tram-station.js, building-collision.js, app.js, ranch-map.js에서 서쪽 개구부와 지붕 아래 도보 목적지를 연결했다. 판자 벽과 벤치는 충돌을 유지한다.
- 정차 트램의 Three.js 외관 껍데기를 비우고 양옆 긴 나무 벤치, 마룻바닥, 가운데 통로, 곡면 천장과 전구, 황동 선반, 운전석 칸막이를 추가했다. buildings-three.js의 2D 렌더러도 창 유리의 투명도를 쓴다. 탑승과 운행은 구현 전이다.
- 전체 npm test 통과. 자동 검사에서 쉼터 진입·벽 충돌·객실 창 시야·통로·PC와 휴대폰 모델 투영을 확인했다. 별도 로컬 시안의 실제 Three.js 모델로 외부와 내부 이미지를 각각 렌더링했다. 브라우저 조작 검증과 공개 배포는 진행하지 않았다.


### 트램 객실의 오래된 참나무 마감

- main a0c3002 기반의 별도 로컬 시안. tram-oak.js에서 판재별 결, 옹이, 바랜 마감, 긁힌 흔적을 생성하고 tram-station.js의 좌석과 바닥 및 객실 창틀과 칸막이에 입혔다. 좌석은 반광, 발길이 닿는 바닥은 무광으로 표현했다.
- building-models.js는 재질별 메시를 합칠 때 UV를 보존하고 buildings-three.js는 Canvas 경로에서도 같은 무늬를 사용한다. tests/tram-station.mjs에 목재 UV와 마감 검사를 추가했다.
- 전체 npm test 및 마지막 창틀 보정 뒤 트램 검사 통과. 객실 미리보기는 실제 Three.js 메시와 질감으로 Blender에서 별도 조명을 사용해 렌더링했다. 로컬 적용 상태다.

### 철길을 바라보는 간이역

- 간이역 중심(X 66, Z 50)을 유지하고 입구와 벤치를 철길 쪽으로 90도 돌렸다. 역 안쪽에서 정차한 트램이 보이고, 승강장(X 66, Z 47.98)과 대기 위치를 오갈 수 있다. 모델, 벽 충돌, 보행 경로를 함께 수정하고 시야와 동선을 검사했다. 로컬 시안에 반영했다.
- 트램 양쪽 행선판의 ‘북’에서 ㅜ의 세로획을 아래로 고쳤다. 트램 검사 통과 후 로컬 시안을 다시 렌더링해 표기를 확대 확인했다.

### 바람목장역 행선지 선택

역에 도착하면 북극·사막·정글을 고를 수 있게 했다. 행선판은 처음에 양쪽 모두 비어 있고 선택 후에만 목적지가 뜬다. 취소는 기존 선택을 유지한다. GitHub main a0c3002 기준으로 전체 테스트와 독립 Chromium 검수(PC WebGL 지도 이동, 휴대폰 크기 터치 및 Canvas 역 입장, 세 행선지 교체)를 통과했다.

### 2026-11-23 — 승객 키에 맞춘 트램과 간이역

- main 2b1e0189 기준. 트램 바닥 위 최저 조명 2.47, 운전실 문틀 2.30, 간이역 입구 2.52. 승강장과 역 판자 높이를 캐릭터의 발 위치 및 깊이 판정에 반영했다.
- 전체 npm test 통과. PC WebGL 및 휴대폰 크기 Canvas에서 역 방문, 승강장 보행과 행선지 표시를 독립 검수했다.

### 2026-11-23 — 건물 지붕 문구 제거와 고정 나무간판

- main 50e5be6 기준. 건물 모델을 그린 뒤 배경 위에 이름과 상태를 다시 쓰던 app.js의 별도 단계와 buildings-three.js의 기본 라벨을 제거했다. 축사·닭장·숙소·풍차에는 나무 글자 메시를 붙이고 창고는 기존 판벽에 이름을 그린다. 닭장 이름은 ‘닭들의 집’이다.
- 전체 npm test 통과. 독립 검수에서 PC 및 휴대폰 크기의 다섯 건물을 세 각도로 확인하고 클릭·터치 10회가 모두 입장·공사 안내로 이어지는지 확인했다.

### 2026-11-23 — 바람목장역 트램 탑승

- main 8300fff 기준. 행선지를 고르고 ‘열차 타기’나 트램을 누르면 승강장까지 걸어간 뒤 탑승한다. 도중에 다른 곳을 선택하면 탑승 예약이 취소된다.
- 게임과 같은 트램 메시를 객실 안에서 그린다. 창밖은 약 16초에 걸쳐 목장에서 북극·사막·정글 풍경으로 바뀌며 도착 후에도 감상할 수 있다. ‘목장역으로 돌아가기’로 승강장에 복귀한다. 도착지 도보 탐험은 이번 범위에 포함되지 않는다.
- dist/app.js, dist/index.html, dist/style.css, dist/render/buildings-three.js, dist/render/tram-ride.js에서 연결했다. tests/camera.cjs에 승강장 접근·취소·도착·복귀·재탑승을 추가했고 전체 npm test를 통과했다.
- 독립 브라우저 검수에서 PC 크기의 북극행 승차·창밖 빙산·도착, 휴대폰 크기의 정글행 승차·도착·목장 복귀·사막행 재탑승을 확인했다. 두 화면은 Canvas 경로에서 조작했다.

### 2026-11-23 — 트램 객실에서 좌우·상하 둘러보기

- main 56632ae 기준. 승차 당시의 창가 시선을 기준으로 좌우 360도와 상하 회전을 지원한다. 손가락·마우스로 밀거나 PC 방향키로 조작한다. 운행과 도착 후 감상에 같은 조작을 사용하며 재승차하면 초기 시점으로 돌아간다.
- dist/app.js, dist/render/tram-ride.js, dist/index.html, dist/style.css에 승차별 시점과 입력 처리, 카메라 방향에 따라 다시 그리는 객실과 연결된 창밖 풍경을 반영했다. tests/camera.cjs와 docs/REGRESSIONS.md에 확인 절차를 추가했다.
- 전체 npm test 통과. 휴대폰 크기 390×760의 Canvas 미리보기에서 검수 담당자가 북극행 반대편 창과 도착 후 천장으로 시선을 바꾸는 동작을 직접 확인했다. 공개 파일의 캐시 키도 갱신했다.

### 2026-11-23 — 트램 벤치에 앉은 내 모습

- main aee7042 기준. dist/render/tram-ride.js에서 목장과 같은 drawVisitor와 currentAppearance를 사용한다. 나무 벤치의 윗면에 앉은 자세의 골반을 맞췄다. 타면 맞은편에서 내 모습과 창밖이 함께 보이고, 눈을 돌려도 캐릭터는 같은 좌석에 머문다. 다른 차림으로 다시 타면 새 모습을 그린다.
- dist/index.html과 dist/app.js에서 해당 버전의 모듈을 불러오도록 변경했다. tests/visitor-appearance.mjs와 docs/REGRESSIONS.md에 네 차림, 재탑승, 시야를 돌렸다 되돌리는 검사를 추가했다.
- 전체 npm test 통과. 독립 검수에서 밀짚모자·적갈색 머리·벽돌색 외투를 선택한 뒤 목장과 객실의 차림을 비교했다. 벤치에 앉은 자세와 신발이 보이고, 운전실을 보고 돌아와도 같은 좌석에 있는지 확인했다.

### 2026-11-23 — 트램 창밖 시야 개선

- main 59581599 기준. 객실 입장 시 눈높이를 올리고 맞은편 옆창을 향해 구도를 잡았다. 앉은 캐릭터가 화면 한쪽에 남는다. ‘창밖 크게 보기’는 창유리 가까이에서 풍경을 보여주며 ‘좌석 보기’로 복귀할 수 있다. 두 시점 모두 기존 드래그 조작을 쓰고 이동 시간과 행선지를 공유한다.
- dist/render/tram-ride.js, dist/app.js, dist/index.html, dist/style.css에서 시점과 버튼을 연결했다. tests/camera.cjs와 tests/visitor-appearance.mjs에 시점 전환, 시간 유지, 좌석 구도와 도착 후 복귀 검사를 추가했다.
- 휴대폰 크기에서 북극 바다와 빙산이 보이는 창가 시점을 독립 검수했다. 좌석의 신발이 하단 버튼과 겹쳤던 세로 구도는 카메라 기울기를 조정하고 신발 아래 공간을 검사하도록 보완했다. 전체 npm test 통과.

### 2026-11-23 — 승강장에서 보는 트램 탑승

- main cde8b7e 기준, tram-boarding-shot 브랜치. 행선지를 고르고 승강장에 도착하면 같은 차림의 캐릭터가 열린 트램 측면 문을 통해 발판과 객실 바닥으로 올라간다. 발이 안에 닿은 뒤 외부 시점을 1초 유지하고 객실로 전환하면서 운행을 시작한다.
- dist/game/tram-station.js, dist/render/tram-station.js, dist/render/buildings-three.js에 동선과 열린 문을 연결했다. dist/app.js, dist/index.html, dist/style.css에서 승강장 구도, 탑승 단계와 객실 전환을 처리한다.
- tests/camera.cjs와 tests/tram-station.mjs에서 탑승 시각, 운행 시작, 취소·재탑승, 실제 출입구 폭을 확인했다. 별도 검수에서 휴대폰과 PC 크기로 북극·사막행에 탑승해 기둥이 캐릭터나 문을 가리지 않고 같은 차림으로 객실에 들어가는 모습을 확인했다.

### 2026-11-23 — 북극 트램 승강장과 얼음 해안

- main c0c8e80, arctic-landing 브랜치. 북극행 마지막 3초에는 물결을 남기는 트램이 나무 승강장에 정차한다. 객실에 남거나 ‘내리기’로 열린 문에서 발판을 밟고 얼음까지 내려간다. 얼음을 누르면 걷고 화면을 밀면 제자리에서 주변과 트램을 돌아본다. 목장역으로 돌아가 재탑승할 수 있다.
- dist/game/arctic-landing.js, dist/render/arctic-landing.js에서 카메라와 보행 경계, 해안과 트램을 구현했다. dist/app.js, dist/index.html, dist/style.css에서 기존 승차 흐름에 연결하고 dist/render/buildings-three.js의 폴리곤 클리핑을 재사용했다. tests/camera.cjs에 도착 전후와 귀환 검사를 추가했다.
- PC와 휴대폰 크기 미리보기에서 북극행, 하차, 같은 차림으로 얼음 위를 걷는 모습을 독립 검수했다. 휴대폰에서 물결이 희미해 객차 앞뒤에 짧고 밝은 호를 넣고 정차 후 잦아들게 조정했다. 전체 npm test 통과.

### 2026-11-23 — 목장역행 트램과 왕복 하차

- tram-round-trip 브랜치, main adc9b39 기준. 북극 해안에서 ‘목장역행 열차 타기’를 누르면 현재 위치에서 얼음과 승강장을 걸어 실제 문으로 올라간다. 두 발이 객차에 닿으면 1초 후 같은 차림으로 객실에 앉는다. 돌아오는 길에는 창밖 풍경이 출발지에서 목장으로 역순으로 이어진다.
- 목장역 도착 뒤 ‘내리기’를 누르면 승차 장면의 동선을 거꾸로 걸어 실제 목장 승강장으로 내려온다. 하차 시설이 없는 사막·정글과 운행 도중에는 탑승해 있는 객차에서 귀환한다. 첫 목장 탑승 장면에서는 승차를 취소할 수 있다.
- dist/app.js, dist/game/arctic-landing.js, dist/render/arctic-landing.js, dist/render/buildings-three.js, dist/index.html에 적용했다. tests/camera.cjs와 tests/tram-station.mjs에서 얼음 모서리 귀환, 보행 경계, 1초 대기, 창가에서 좌석 복귀, 중복 클릭, 왕복 운행, 실제 목장 하차, 양쪽 목장역행 표지를 확인한다.
- 전체 npm test 통과. 독립 검수에서 휴대폰과 PC 크기로 얼음에서 열차까지 걷기, 문 안 대기, 같은 옷차림으로 좌석에 앉기, 빙산에서 목장 능선으로 바뀌는 창밖 풍경, 목장역 하차와 재탑승 버튼을 확인했다.
