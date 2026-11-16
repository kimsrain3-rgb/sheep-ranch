# 바람목장 유지보수 안내

이 사이트는 빌드나 외부 패키지 없이 실행하는 ES 모듈 기반 Canvas 게임입니다.
기존 일러스트풍, 360도 카메라, 모바일 메뉴와 아바타 방향 전환을 유지합니다.

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
실제 입체 모델 대신 기존 일러스트를 원근 투영하여 표현합니다.
배경음악은 사용자가 제공한 Pastoral Loop.mp3를 사용합니다.

옷 당기기는 교감 확대를 사용하지 않습니다. 양이 옷 끝까지 접근한 뒤 짧은 옷 주름만 그립니다. 입과 옷자락 간격은 `tests/tug.mjs`가 여러 카메라 각도에서 검증합니다. 긴 연결선이나 팔 올리기 동작을 추가하지 마세요.

우유주기는 `render/milk-pose.js`의 고정 길이 팔과 무릎 굽힌 전용 자세를 사용합니다. 서 있는 어깨에서 새끼 입까지 연결선을 그리지 않습니다. 양 옆 0.82 거리의 마른 지점에 도착한 뒤 시작하며 `tests/milk-pose.mjs`가 자세와 거리를 검증합니다.

보행 관절은 `game/gait.js`에서 계산합니다. 무릎은 진행 방향의 수직 평면에서만 굽히고, 정면/뒷모습의 다리 가로 위치는 고정합니다. `tests/gait.mjs`는 뼈 길이, 무릎 굽힘 방향, 발 교대, 디딤발과 발 들기를 검증합니다. 우유 주기의 무릎 굽힌 자세는 별도 모듈이라 영향을 받지 않습니다.

교감 예약과 실제 접촉은 다릅니다. `careContact`는 다가가기를 완료하고 손길/젖병 동작이 시작될 때만 true로 설정합니다. 눈 감기·볼 표현은 이 값에 따르고, 취소와 완료는 unlock에서 해제합니다. `tests/contact-eyes.mjs`가 실제 양 렌더러의 접근/접촉/종료 표현을 검증합니다.

합성 바람 잡음은 제거했습니다. 현재 소리 버튼은 음악과 양 울음을 함께 제어합니다. 배경음악은 사용자 MP3를 반복 재생합니다.

배경음악은 `dist/assets/pastoral-loop.mp3`입니다. `MeadowAudio`가 HTMLAudioElement 하나로 스트리밍하며 loop=true, volume=0.22로 재생합니다. 소리 버튼은 음악과 양 울음을 함께 제어하고, 끄면 현재 위치에서 일시정지합니다. MP3 전체를 PCM으로 메모리에 올리지 않습니다. 연속 클릭은 진행 중인 재생 요청 하나로 합쳐 처리합니다. 바람 소리는 생성하지 않습니다.

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

Pet closeup composition: the chosen sheep and visitor render as one depth-sorted foreground pair. Nonparticipant animals overlapping their screen area recede to .22 alpha only during petting; their world positions and behavior remain unchanged. This prevents a passing sheep from hiding the contact, in addition to the pair’s physical separation.

## 양치기 개와 닭장

`CONFIG.coop`은 양 축사 오른쪽에 있는 별도 닭장이다. 비·눈·밤 또는 목동의 모으기 명령으로 `WeatherShelter.active`가 되면 `Companions`가 닭을 `dryRoute()`로 닭장 입구까지 걷게 한다. 한 개는 양을, 다른 개는 닭을 우선 몰고, 한 무리가 먼저 들어가면 남은 무리를 돕는다. 닭은 입구에 도착한 뒤에만 `hiddenInCoop`이 되며, 날씨가 개면 순서대로 걸어 나온다. 동행견은 몰이가 끝나면 목동 곁으로 돌아간다.

닭장 외관과 쉬는 닭 수는 `render/shelter.js`의 `drawCoop()`이 그린다. 닭장 안은 방문자가 들어가는 공간이 아니다. 양 축사 실내에는 양만 표시한다. `tests/coop.mjs`가 건물 간격, 개의 몰이, 닭의 연속 이동과 순차 출입을 확인한다.

## 목동과 강아지의 2층 숙소

`CONFIG.lodge`는 축사 뒤편에 간격을 두고 놓인 2층 집이다. 이전 버전 31의 평면 숙소 팝업은 방문자가 실제 방에 들어가 걸을 수 없어서 폐기했다. `game/lodge.js`의 `LodgeVisit`는 축사의 `BarnVisit`처럼 방문자를 문까지 걷게 하고, 실내 좌표로 전환한다. 1층에서 바닥을 눌러 이동하거나 WASD로 걸으며 침대, 식탁, 난로, 세면대, 책장과 두 개의 강아지 자리를 볼 수 있다. 계단을 누르거나 계단 버튼을 누르면 그곳까지 걸어간 뒤 2층으로 올라간다. 2층에서도 발코니를 걷고 같은 계단으로 내려오며, 퇴장하면 원래 목장 문 앞에 나온다.

`render/lodge.js`는 축사 실내와 동일한 투영 방식으로 두 층의 바닥, 벽, 가구, 난간을 그린다. 2층 뒤편에는 `lookoutView`를 실제 숙소 위치에 고정해 기존 목장의 지형·축사·닭장·동물을 실시간으로 렌더링한다. 방문자가 카메라를 돌리면 전망 방향도 함께 변한다. 목동과 개가 쉬는 중이면 1층에서 그 캐릭터를 볼 수 있다. 모바일 메뉴도 동일한 숙소 진입 버튼을 사용한다.

비·눈·밤 또는 모으기 명령으로 모든 양이 축사에 들어가면 목동은 `dryRoute()`를 따라 숙소로 이동한다. 개들은 양과 닭의 몰이를 끝낸 다음 숙소로 걸어가 쉰다. 이때에만 목장 화면에서 숨기고 실내에 표시한다. 피신이 끝나면 모두 문 앞에서 다시 밖으로 나온다. `tests/lodge.mjs`는 건물 간격, 목동·개 이동, 방문자의 1층 진입·보행·계단·2층 보행·퇴장과 전망 시점의 숙소 위치를 검사한다.
