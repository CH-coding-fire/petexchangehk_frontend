import axios from 'axios';
import { useState } from 'react';
import { Card, Row, Col, Button, Carousel,  } from 'react-bootstrap';
import AnimalDetailsModal from '../AnimalDetailsModal';
import { v4 as uuidv4 } from 'uuid';
import currentAgeCalChinese from '../../scripts/currentAgeCal';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useContext } from 'react';
import { QueryContext } from '../../Context/QueryContext';
import { cnTrans } from '../../scripts/cnTrans';
import { dateStringToDDMMYY } from '../../scripts/dateStringToDDMMYY';
import shuffleArray from '../../scripts/shuffleArray';
import ConfirmModal from './ConfirmModal';
import { queryAnimalTypeFilter } from '../../scripts/queryAnimalTypeFilter';
import splitAvailUnavail from '../../scripts/splitAvailUnavail';
import { checkHaveShadow, shadowAssigner } from '../../scripts/shadowController';
import UpdateAnimalModal from './UpdateAnimalModal';
import { targetServerURL } from '../../App';
import BackdropMsg from './BackdropMsg';
import { useSwipeable } from 'react-swipeable';


//This CardGroup component
//1.  request and extract data data from the server
//2. Create cards according to the number of piece of animal data
//3. Shadow cards according to conditions such as transaction successful and temp close


const initialSlidersState = {};
const cardsModelState = {};
let onceFor = 0;



const CardGroup = ({user}) => {
	const navigate = useNavigate(); //Todo Need to investigate if this is necessary
	const { queryContext, setQueryContext } = useContext(QueryContext) //this is for storing user's filter choice
	const [data, setData] = useState([]); //This is for initiating data as empty to ready to GET data from backend
	const [loadingOrErrorMsg, showLoadingOrErrorMsg] = useState('loading 載入中...'); //This is for show loading if GET not completed
	const [show, setShow] = useState(false); //This is for showing modal or not, initial value is not show
	const [controlNumber, setControlNumber] = useState(null);
	const [slidersState, setSlidersState] = useState(initialSlidersState);
	const [confirmModalShow, setConfirmModalShow] = useState(false);
	const [updateAnimalModalShow, setUpdateAnimalModalShow] = useState(false);

	const [touchStart, setTouchStart] = useState(null)
	const [touchEnd, setTouchEnd] = useState(null)

	const minSwipeDistance = 50

const onTouchStart = (e) => {
  setTouchEnd(null) // otherwise the swipe is fired even with usual touch events
  setTouchStart(e.targetTouches[0].clientX)
}

const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

const onTouchEnd = () => {
  if (!touchStart || !touchEnd) return
  const distance = touchStart - touchEnd
  const isLeftSwipe = distance > minSwipeDistance
  const isRightSwipe = distance < -minSwipeDistance
  if (isLeftSwipe || isRightSwipe) console.log('swipe', isLeftSwipe ? 'left' : 'right')
  // add your conditional logic here
	}

	const handlers = useSwipeable({
		 onSwiped: (eventData) => console.log("User Swiped!", eventData),
		onSwipedLeft: (eventData) => console.log("User left!", eventData),
		onSwipedRight: (eventData) => console.log("User right!", eventData),
});

	const handleShow = (index) => {
		// console.log('HANDLE_SHOW:control number:', index);
		setShow(true);
		setControlNumber(index);
	};
	const handleClose = () => {
		setShow(false);
		for (let i = 0; i < data.length; i++) {
			cardsModelState[i] = false;
			onceFor = 0;
		}
	};

	const closeUpdateAnimalModalHandler = () => {
		setUpdateAnimalModalShow(false);
	}


	const handleConfirmModalClose = (index) => {
		setConfirmModalShow(false);
	}

	const confirmHandler = ({ index=null, option=null }) => {
		switch (option) {
			case 'delete':
				console.log('deleting...');
				deleteAdoptionHandler(index)
			case 'updateSuccess':
				// adoptionSuccessHandler(index, 'updateSuccess', false)
				updateAnimalHandler({ index: index, option:option, avail:false})
			default:
				break
		}
	}

	const updateAnimalHandler = ({ index = null, option = null, avail = null, animalId = null, updateContent = null }) => {
		let body = {}
		switch (option) {
			case 'updateAvail':
				body = { option: option, updateContent: { availableForAdoption: avail } }
				break;
			case 'updateSuccess':
				body = { option: option, updateContent: { availableForAdoption: avail,adoptionSuccessful: true,  } }
				break;
			case 'updateAnimalInfo':
				console.log('hi')
				body = { option: option, updateContent:updateContent}
				break;
			default:
				break
		}

		console.log('BODY', body)
		console.log(animalId)


		axios.put(`${targetServerURL}/adoptions/`, { animalId: (animalId? animalId:data[index]._id), ...body })
			.then((res) => {
				if (option === 'updateAvail' || option === 'updateSuccess') {
					data[index].shadow = { shadow: !avail, option: option }
					option === 'updateSuccess' && setConfirmModalShow(false)	//update shadow, !avail is because it is NOT avial for adoption(false), then shadow is true
				}
				setData([...data])
				console.log(res.data)
				if (option === 'updateAnimalInfo') {
					window.open('/', '_self');
				}
			}).catch((error)=>{console.log(error)}
			)
	}

	const deleteAdoptionHandler = (index) => {
		axios.delete(`${targetServerURL}/adoptions/${data[index]._id}`)
			.then((msg) => {
				console.log(msg)
				setConfirmModalShow(false);
				window.location.reload(false);
			}).catch((msg) => {
				navigate('deletefail')
			})

	}
	const [carouselIndex, setCarouselIndex] = useState(null);
	const handleSelect = (selectedIndex, e) => {
		// console.log('HANDLE_SELECT', selectedIndex);
		setCarouselIndex(selectedIndex);
	};



	useEffect(() => { //This is for fetching the data from backend, according to filter
		const targetRoute = '/adoptions/'
		axios
			.get(`${targetServerURL}${targetRoute}`)
			.then((values) => { //receive animal data from backend
				console.log('values.data:', values.data); //for displaying the array of animals
				let sortedData; //this is for creating a value for later filtering of data
				// console.log('QUERY', queryContext) //for showing what the user choose to filter, if users do not choose, the value is null
				if(queryContext){ //if user use filter,
					if (queryContext.option === 'searchAnimalByType') {
						sortedData = queryAnimalTypeFilter(values.data, queryContext)
					} else if (queryContext.option === 'searchAnimalByUserNickName') {
						sortedData = queryAnimalTypeFilter(values.data, queryContext)
					}
				}else {
					sortedData = shuffleArray(values.data) //randomize the order to cards
				}
				setData(shadowAssigner(splitAvailUnavail(sortedData))) //todo I forgot what is shadowAssigner
				return shadowAssigner(splitAvailUnavail(sortedData))
			}).then((dataRetrieved) => {
				if (dataRetrieved.length === 0) { //if there is no data (no data in array)
					showLoadingOrErrorMsg('沒有搜尋結果, 可能你要的動物不存在, 或者擴大搜索範圍')
				} else if (dataRetrieved.length > 0){
				showLoadingOrErrorMsg('') //if there is data, make useState's initial value "loading 載入中..." to disappear
				}
			}).catch((err) => {
				console.log(err);
				showLoadingOrErrorMsg(err.message); //display the error message to users
			});
	}, [queryContext]) //if users change their selection of this filter, this will run

	for (let i = 0; i < data.length; i++) {
		initialSlidersState[i] = 0;
	}
	if (onceFor === 0) {
		for (let i = 0; i < data.length; i++) {
			cardsModelState[i] = false;
			onceFor++;
		}
	}
	const handleCardsModelState = (index) => {
		cardsModelState[index] = true;
	};

	const nextSlide = (sliderId, numOfImg) =>
		setSlidersState((prev) => {
			const currentIndex = prev[sliderId];
			let newIndex;
			if (currentIndex === numOfImg) {
				newIndex = numOfImg;
			} else {
				newIndex = currentIndex + 1;
			}
			return { ...prev, [sliderId]: newIndex };
		});
	const previousSlide = (sliderId, numOfImg) =>
		setSlidersState((prev) => {
			const currentIndex = prev[sliderId];
			let newIndex;
			if (currentIndex === 0) {
				newIndex = 0;
			} else {
				newIndex = currentIndex - 1;
			}
			return { ...prev, [sliderId]: newIndex };
		});


	//The behavior of the interface:
	//1. Initially there would be no data, a message of "loading 載入中..." will be displayed.
	//2. A request will be sent to server to receive data.
	//3. Card appear according to data
	//4. The sequence of items in card, is backdrop > carosel > animal details > button
	//4. If the card has "shadow" (a key in animal's data), then there will be BackdropMsg, e.g. "已完成交易"
	return (
		<>
			{/* <div {...handlers}> You can swipe here !!!!!!!!!!!!!!!!!</div>; */}


			{/* <div {...handlers}> You can swipe here2 !!!!!!!!!!!!!!!!!</div>; */}



			{/* <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>Hello world</div> */}
			{loadingOrErrorMsg && <h1>{loadingOrErrorMsg}</h1>} {/*this is for to show "loading 載入中" or "cannot find" 沒有搜尋結*/}
			<Row xs={1} md={2} lg={3} xl={4} className="no_padding" > {/*determine the number of cards shown each row according to screen width*/}
				{data.map((animal, index) => (//todo 'animal' is The current element being processed in the array. Index is the The index of the current element being processed in the array
					<Col className='no_padding'>
						<Card
							className={`no_padding shadow ${animal.shadow && "backdrop"} ${(animal.availableForAdoption === false) && "backdrop"}`}>
							{/* if that animal is available for adoption or have shadow, then there will be backdrop, which means the card would be darken and unclickable */}
							{/**For below checkHaveShadow, if the animal have shadow, then there would be BackdropMsg  */}
							{checkHaveShadow(animal) &&
								<BackdropMsg animal={animal} index={index} user={user} updateAnimalHandler={updateAnimalHandler } />
								} {/*BackdropMsg is for showing it serves to display message according to the condition of the info of animal*/}
							<Carousel
								// className='slide' //!trying to make it work according to one answer in github
								key={index}
								onSelect={() => handleSelect(index)}
								touch={true} // Whether the carousel should support left/right swipe interactions on touchscreen devices.
								//! This is not working even on developer tools
								controls={true} // Show the Carousel previous and next arrows for changing the current slide
								indicators={true} // Show a set of slide position indicators (see the horizontal bars in the carousels, it indicates the number of photos )
								interval={null} //The amount of time to delay between automatically cycling an item. If null, carousel will not automatically cycle.
								activeIndex={slidersState[index]}
								nextIcon={
									<span
										key={uuidv4()}
										aria-hidden="true"
										className="carousel-control-next-icon"
										onClick={() => {
											nextSlide(index, animal.animalImages.length - 1);
										}}
									/>
								}
								prevIcon={
									<span
										key={uuidv4()}
										aria-hidden="true"
										className="carousel-control-prev-icon"
										onClick={() =>
											previousSlide(index, animal.animalImages.length - 1)
										}
									/>
								}


							>
								{animal.animalImages.map((img, index) => {
									img = img.replace(
										'/upload',
										'/upload/w_1000,ar_1:1,c_fill,g_auto'
									);
									return (
										<Carousel.Item >
											<img
												key={uuidv4()}
												className="d-block w-100"
												src={img}
												alt="Slides"
												onClick = {()=>console.log('clicked')}
												// onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
												// {...handlers}
											/>


										</Carousel.Item>
									);
								})}
							</Carousel>
							{/* <div {...handlers}>swipe HERE!!!</div> */}
							<Card.Body >
								<Card.Text className='ps-3'>
									品种:{' '}
									{`${animal.animalSpeciesName}<${
										animal.animalSpecies ? `${cnTrans(animal.animalSpecies)}<` : ''
									}${animal.animalGenera ? `${cnTrans(animal.animalGenera)}<` : ''}${
										animal.animalClasses ? `${cnTrans(animal.animalClasses)}` : ''
									}
										`}
									<br />
									{animal.animalName != '' && //if that animal has no name, then that space would be skipped
										<span>
											<span>名字: {animal.animalName}</span>
											<br />
										</span>
									}
									性別: {cnTrans(animal.animalSex)}
									<br />
									年齡:{' '}
									{currentAgeCalChinese(animal.postDate, animal.animalAge)}
									<br />
										{((animal.urgencyOptions === "urgent") || (animal.urgencyOptions === "mostUrgent")) &&
											<div>緊急程度: <span className='fw-bold' style={{ color: '#FF0000' }}>{cnTrans(animal.urgencyOptions)}</span></div>}
									{animal.animalPrice?<div>價錢或補償: <span className='fw-bold'>${animal.animalPrice} HKD</span></div>:<div>價錢或補償: <span className='fw-bold'>免費領養</span></div>}
										用戶名稱: <span onClick={() => { setQueryContext({ user: animal.creator.nickname, option: 'searchAnimalByUserNickName' }) }}
											className='text-decoration-underline'
											style={{ cursor: 'pointer', color: '#663366' }}>
											{animal.creator.nickname}</span>
									<br />
									張貼日期: {dateStringToDDMMYY(animal.postDate)}
									{/* 張貼日期: {animal.postDate.toLocaleDateString()} */}
								</Card.Text>

								<div className="d-flex flex-wrap justify-content-center">
									<Button
										className=" m-2"
										key={uuidv4()}
										variant="primary"
										onClick={() => {
											handleShow(carouselIndex);
											handleCardsModelState(index);
											handleSelect(index);
											}}
									>
										<i className="fa-solid fa-hand-point-right">
											&ensp;詳情及聯絡方法
										</i>
									</Button>
									{(animal.creator) ? (user.nickname === animal.creator.nickname && //If the user is the creator of that animal, display below button
										<div>
									<Button
										className=" m-2"
										key={uuidv4()}
										variant="info"
										onClick={() => {
											setUpdateAnimalModalShow({index:index, option:'updateAnimal'});
										}}
									>
										更新資料
									</Button>


									<Button
										className=" m-2"
										key={uuidv4()}
										variant="warning"
										onClick={() => {
											updateAnimalHandler({ index: index, option: 'updateAvail', avail: false })
										}}
									>
										暫停開放
									</Button>
									<Button
										className=" m-2"
										key={uuidv4()}
										variant="danger"
											onClick={() => {
												setConfirmModalShow({index:index, option:'delete'});
										}}
									>
										刪除
									</Button>
									<Button
										className=" m-2"
										key={uuidv4()}
										variant="success"
										onClick={() => {
											setConfirmModalShow({ index: index, option: 'updateSuccess' })
										}}
									>
										完成領養
										</Button>
									</div>) : <div></div>}

								</div>
								</Card.Body>
						</Card>
						{cardsModelState[index] === true && (
							<AnimalDetailsModal
								key={uuidv4()}
								handleShow={handleShow}
								handleClose={handleClose}
								animal={animal}
								index={index}
								controlNumber={controlNumber}
								cardsModelState={cardsModelState}
							/>
						)}
						{confirmModalShow &&
							<ConfirmModal
								closeHandler={handleConfirmModalClose}
								confirmHandler={confirmHandler}
								index={confirmModalShow.index}
								option={confirmModalShow.option} />}
						{updateAnimalModalShow && updateAnimalModalShow.index === index &&
							<UpdateAnimalModal
							index={updateAnimalModalShow.index}
							animal={data[updateAnimalModalShow.index]}
							option={updateAnimalModalShow.option}
								updateAnimalHandler={updateAnimalHandler}
								closeUpdateAnimalModalHandler={closeUpdateAnimalModalHandler}
/>}
					</Col>
				))}
			</Row>
		</>
	);
};



export default CardGroup;
